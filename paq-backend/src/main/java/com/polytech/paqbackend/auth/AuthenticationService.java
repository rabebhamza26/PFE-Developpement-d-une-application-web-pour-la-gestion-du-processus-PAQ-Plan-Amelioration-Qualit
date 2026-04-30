package com.polytech.paqbackend.auth;

import com.polytech.paqbackend.config.JwtService;
import com.polytech.paqbackend.entity.User;
import com.polytech.paqbackend.repository.UserRepository;
import com.polytech.paqbackend.token.Token;
import com.polytech.paqbackend.token.TokenRepository;
import com.polytech.paqbackend.token.TokenType;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository repository;
    private final TokenRepository tokenRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;  // AJOUTER

    public AuthenticationResponse register(RegisterRequest request) {
        var user = User.builder()
                .nomUtilisateur(request.getNomUtilisateur())
                .login(request.getLogin())
                .email(request.getEmail())  // AJOUTER l'email
                .password(passwordEncoder.encode(request.getPassword()))  // 🔥 ENCODER LE MOT DE PASSE
                .role(request.getRole())
                .active(true)
                .build();

        var savedUser = repository.save(user);
        var jwtToken = jwtService.generateToken(savedUser);
        var refreshToken = jwtService.generateRefreshToken(savedUser);
        saveUserToken(savedUser, jwtToken);

        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        // 🔥 L'authentification utilise le PasswordEncoder automatiquement
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getLogin(),
                        request.getPassword()
                )
        );

        var user = repository.findByLogin(request.getLogin());
        if (user == null) throw new RuntimeException("Utilisateur non trouvé");

        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        revokeAllUserTokens(user);
        saveUserToken(user, jwtToken);

        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .build();
    }

    private void saveUserToken(User user, String jwtToken) {
        var token = Token.builder()
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