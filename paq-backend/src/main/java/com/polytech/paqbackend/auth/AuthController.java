package com.polytech.paqbackend.auth;

import com.polytech.paqbackend.config.JwtService;
import com.polytech.paqbackend.entity.ErrorResponse;
import com.polytech.paqbackend.entity.LoginRequest;
import com.polytech.paqbackend.entity.LoginResponse;
import com.polytech.paqbackend.entity.User;
import com.polytech.paqbackend.repository.UserRepository;
import com.polytech.paqbackend.token.Token;
import com.polytech.paqbackend.token.TokenRepository;
import com.polytech.paqbackend.token.TokenType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final TokenRepository tokenRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        // 🔹 Recherche par login
        User user = userRepository.findByLogin(request.getLogin());

        // 🔹 Vérification utilisateur et mot de passe (en clair — pas BCrypt)
        if (user == null || !user.getPassword().equals(request.getPassword())) {
            return ResponseEntity.status(401).body(
                    new ErrorResponse("INVALID_CREDENTIALS", "Identifiants incorrects")
            );
        }

        // 🔹 Vérifier si actif
        if (!user.isActive()) {
            return ResponseEntity.status(403).body(
                    new ErrorResponse("USER_DISABLED", "Compte désactivé")
            );
        }

        // 🔹 Révoquer les anciens tokens
        revokeAllUserTokens(user);

        // 🔹 Génération des JWT
        String accessToken  = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        // 🔹 Sauvegarder le token
        saveUserToken(user, accessToken);

        // 🔹 Construction de la réponse
        LoginResponse response = new LoginResponse(
                user.getId(),
                user.getNomUtilisateur(),
                user.getRole().name(),
                request.getSiteName(),
                request.getPlantName(),
                accessToken,
                refreshToken
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(
                    new ErrorResponse("INVALID_TOKEN", "Token manquant")
            );
        }

        String refreshToken = authHeader.substring(7);
        String login;

        try {
            login = jwtService.extractUsername(refreshToken);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(
                    new ErrorResponse("INVALID_TOKEN", "Token invalide")
            );
        }

        User user = userRepository.findByLogin(login);

        if (user == null || !user.isActive()) {
            return ResponseEntity.status(401).body(
                    new ErrorResponse("USER_NOT_FOUND", "Utilisateur introuvable ou désactivé")
            );
        }

        if (!jwtService.isTokenValid(refreshToken, login)) {
            return ResponseEntity.status(401).body(
                    new ErrorResponse("TOKEN_EXPIRED", "Token expiré, veuillez vous reconnecter")
            );
        }

        revokeAllUserTokens(user);
        String newAccessToken = jwtService.generateToken(user);
        saveUserToken(user, newAccessToken);

        return ResponseEntity.ok(new AuthenticationResponse(newAccessToken, refreshToken));
    }

    // ─── helpers ────────────────────────────────────────────────────────────

    private void saveUserToken(User user, String jwtToken) {
        Token token = Token.builder()
                .user(user)
                .token(jwtToken)
                .tokenType(TokenType.BEARER)
                .expired(false)
                .revoked(false)
                .build();
        tokenRepository.save(token);
    }

    private void revokeAllUserTokens(User user) {
        var validTokens = tokenRepository.findAllValidTokenByUser(user.getId());
        if (validTokens.isEmpty()) return;
        validTokens.forEach(t -> {
            t.setExpired(true);
            t.setRevoked(true);
        });
        tokenRepository.saveAll(validTokens);
    }
}