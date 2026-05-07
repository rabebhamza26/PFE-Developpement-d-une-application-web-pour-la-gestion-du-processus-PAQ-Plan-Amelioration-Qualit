package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.CreateUserRequest;
import com.polytech.paqbackend.dto.SiteUserDistributionDTO;
import com.polytech.paqbackend.dto.UpdateUserRequest;
import com.polytech.paqbackend.dto.UserResponseDto;
import com.polytech.paqbackend.entity.User;
import com.polytech.paqbackend.repository.UserRepository;
import com.polytech.paqbackend.service.EmailService;
import com.polytech.paqbackend.service.UserService;
import com.polytech.paqbackend.token.TokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final TokenRepository tokenRepository;

    @Autowired
    public UserController(UserRepository userRepository, UserService userService,
                          PasswordEncoder passwordEncoder, EmailService emailService,
                          TokenRepository tokenRepository) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.tokenRepository = tokenRepository;
    }

    @GetMapping("/emails")
    public ResponseEntity<List<String>> getPublicEmails() {
        List<User> users = userRepository.findAll();
        List<String> emails = users.stream()
                .map(User::getEmail)
                .filter(email -> email != null && !email.trim().isEmpty())
                .distinct()
                .collect(Collectors.toList());
        return ResponseEntity.ok(emails);
    }

    @GetMapping("/sl/emails")
    @PreAuthorize("isAuthenticated()")

    public ResponseEntity<List<String>> getSlEmails() {
        List<User> users = userRepository.findAll();
        List<String> emails = users.stream()
                .filter(user -> user.getRole() != null &&
                        (user.getRole().name().equals("SL") ||
                                user.getRole().name().equals("ADMIN") ||
                                user.getRole().name().equals("RH")))
                .map(User::getEmail)
                .filter(email -> email != null && !email.trim().isEmpty())
                .distinct()
                .collect(Collectors.toList());
        return ResponseEntity.ok(emails);
    }

    @GetMapping("/by-site")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SiteUserDistributionDTO>> getUsersBySite() {
        return ResponseEntity.ok(userService.getUsersDistributionBySite());
    }

    @GetMapping("/basic")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserResponseDto>> getAllUsersBasic() {
        List<User> users = userRepository.findAll();
        List<UserResponseDto> result = users.stream()
                .map(u -> UserResponseDto.builder()
                        .id(u.getId())
                        .nomUtilisateur(u.getNomUtilisateur())
                        .login(u.getLogin())
                        .email(u.getEmail())
                        .role(u.getRole())
                        .active(u.isActive())
                        .createdAt(u.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/all-emails")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<String>> getAllEmailsAlternative() {
        return ResponseEntity.ok(userService.getAllEmails());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDto> createUser(@RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDto> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id,
                                        @RequestBody UpdateUserRequest request) {
        try {
            UserResponseDto updated = userService.updateUser(id, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDto> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(userService.toggleActive(id));
    }

    // ── méthode utilitaire : révoquer tous les tokens valides ──────────────
    private void revokeAllUserTokens(User user) {
        var validTokens = tokenRepository.findAllValidTokenByUser(user.getId());
        if (!validTokens.isEmpty()) {
            validTokens.forEach(t -> {
                t.setExpired(true);
                t.setRevoked(true);
            });
            tokenRepository.saveAll(validTokens);
        }
    }

    @PatchMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resetUserPassword(@PathVariable Long id,
                                               @RequestBody Map<String, String> payload) {
        try {
            String newPassword = payload.get("newPassword");
            if (newPassword == null || newPassword.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Veuillez fournir un nouveau mot de passe"));
            }

            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            // 1. Révoquer tous les tokens existants
            revokeAllUserTokens(user);

            // 2. Encoder et sauvegarder le nouveau mot de passe
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            // 3. Envoyer l'email
            emailService.sendNewPasswordToUser(user.getEmail(), user.getLogin(), newPassword);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Mot de passe réinitialisé avec succès.",
                    "newPassword", newPassword));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()));
        }
    }

    @PatchMapping("/{id}/reset-password-admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resetPasswordByAdmin(@PathVariable Long id,
                                                  @RequestBody Map<String, String> payload) {
        try {
            String newPassword = payload.get("newPassword");
            if (newPassword == null || newPassword.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Veuillez fournir un nouveau mot de passe"));
            }

            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            // 1. Révoquer tous les tokens existants
            revokeAllUserTokens(user);

            // 2. Encoder et sauvegarder le nouveau mot de passe
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            // 3. Envoyer l'email
            emailService.sendNewPasswordToUser(user.getEmail(), user.getLogin(), newPassword);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Mot de passe réinitialisé avec succès.",
                    "newPassword", newPassword));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Erreur: " + e.getMessage()));
        }
    }

    @PostMapping("/auth/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> payload) {
        try {
            String email = payload.get("email");
            String login = payload.get("login");

            User user = null;

            // findByEmail retourne User, pas Optional
            if (email != null && !email.trim().isEmpty()) {
                user = userRepository.findByEmail(email);
            }
            if (user == null && login != null && !login.trim().isEmpty()) {
                user = userRepository.findByLogin(login);
            }

            if (user == null) {
                return ResponseEntity.ok(Map.of(
                        "success", false,
                        "message", "Aucun utilisateur trouvé avec cet email ou login."
                ));
            }

            // Vérifier que l'utilisateur a un email valide
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "success", false,
                        "message", "Cet utilisateur n'a pas d'email enregistré. Veuillez contacter l'administrateur."
                ));
            }

            // Générer un mot de passe temporaire avec UUID
            String tempPassword = UUID.randomUUID().toString().substring(0, 8);
            user.setPassword(passwordEncoder.encode(tempPassword));
            userRepository.save(user);

            // Révoquer tous les tokens existants
            revokeAllUserTokens(user);

            // Envoyer par email
            emailService.sendNewPasswordToUser(user.getEmail(), user.getLogin(), tempPassword);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Un nouveau mot de passe a été envoyé à votre adresse email.\nVérifiez votre boîte de réception (et vos spams)."
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Erreur lors de la réinitialisation: " + e.getMessage()
            ));
        }
    }

    // Dans UserController.java, ajoutez cet endpoint pour tester l'authentification
    @GetMapping("/test-auth")
    public ResponseEntity<?> testAuth() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(Map.of(
                "authenticated", auth != null && auth.isAuthenticated(),
                "name", auth != null ? auth.getName() : "null",
                "authorities", auth != null ? auth.getAuthorities().toString() : "null"
        ));
    }
}