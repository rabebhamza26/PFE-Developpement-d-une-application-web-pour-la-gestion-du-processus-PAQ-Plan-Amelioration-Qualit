package com.polytech.paqbackend.service;

import com.polytech.paqbackend.dto.ForgotPasswordRequest;
import com.polytech.paqbackend.dto.ForgotPasswordResponse;
import com.polytech.paqbackend.entity.User;
import com.polytech.paqbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ForgotPasswordService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public ForgotPasswordResponse processForgotPassword(ForgotPasswordRequest request) {
        try {
            User user = null;

            if (request.getEmail() != null && !request.getEmail().isEmpty()) {
                user = userRepository.findByEmail(request.getEmail());
            } else if (request.getLogin() != null && !request.getLogin().isEmpty()) {
                user = userRepository.findByLogin(request.getLogin());
            }

            if (user == null) {
                return ForgotPasswordResponse.builder()
                        .success(true)
                        .message("Si votre compte existe, un email a été envoyé à l'administrateur.")
                        .build();
            }

            // Générer un mot de passe temporaire
            String tempPassword = UUID.randomUUID().toString().substring(0, 8);
            user.setPassword(passwordEncoder.encode(tempPassword));
            userRepository.save(user);

            // Envoyer le nouveau mot de passe directement à l'utilisateur
            emailService.sendNewPasswordToUser(
                    user.getEmail(),
                    user.getLogin(),
                    tempPassword
            );

            return ForgotPasswordResponse.builder()
                    .success(true)
                    .message("Un nouveau mot de passe temporaire a été envoyé à votre adresse email.")
                    .build();

        } catch (Exception e) {
            return ForgotPasswordResponse.builder()
                    .success(false)
                    .message("Une erreur est survenue. Veuillez réessayer plus tard.")
                    .build();
        }
    }

    @Transactional
    public ForgotPasswordResponse resetPassword(Long userId, String newPassword) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            String passwordToSet = (newPassword != null && !newPassword.isEmpty())
                    ? newPassword
                    : UUID.randomUUID().toString().substring(0, 8);

            user.setPassword(passwordEncoder.encode(passwordToSet));
            userRepository.save(user);

            emailService.sendNewPasswordToUser(
                    user.getEmail(),
                    user.getLogin(),
                    passwordToSet
            );

            return ForgotPasswordResponse.builder()
                    .success(true)
                    .message("Mot de passe réinitialisé avec succès. Un email a été envoyé à l'utilisateur.")
                    .build();

        } catch (Exception e) {
            return ForgotPasswordResponse.builder()
                    .success(false)
                    .message("Erreur lors de la réinitialisation: " + e.getMessage())
                    .build();
        }
    }
}