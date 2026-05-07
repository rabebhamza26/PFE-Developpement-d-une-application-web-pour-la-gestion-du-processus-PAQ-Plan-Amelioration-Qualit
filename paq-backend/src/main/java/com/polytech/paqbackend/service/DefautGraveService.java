package com.polytech.paqbackend.service;

import com.polytech.paqbackend.dto.DefautGraveRequest;
import com.polytech.paqbackend.entity.Role;
import com.polytech.paqbackend.entity.User;
import com.polytech.paqbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Gère le cas particulier "Défaut grave" :
 *  - Activation immédiate du processus PAQ
 *  - Participation obligatoire du SGL dès le niveau 1
 *  - Notification système + email au(x) SGL
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DefautGraveService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService      emailService;

    /**
     * Déclenche les notifications défaut grave vers tous les SGL actifs
     * (ou vers un SGL spécifique si son email est fourni dans la requête).
     */
    public void notifierDefautGrave(DefautGraveRequest request, String expediteurLogin) {

        String matricule         = request.getMatricule();
        String descriptionDefaut = request.getDescriptionDefaut();

        // Récupérer tous les SGL actifs
        List<User> sgls = userRepository.findAll().stream()
                .filter(u -> u.isActive() && u.getRole() == Role.SGL)
                .collect(Collectors.toList());

        if (sgls.isEmpty()) {
            log.warn("[DefautGrave] Aucun SGL actif trouvé pour notifier le défaut grave sur {}", matricule);
        }

        // Si un email SGL spécifique est fourni, filtrer
        if (request.getSglEmail() != null && !request.getSglEmail().isBlank()) {
            sgls = sgls.stream()
                    .filter(u -> request.getSglEmail().equalsIgnoreCase(u.getEmail()))
                    .collect(Collectors.toList());
        }

        for (User sgl : sgls) {
            // 1. Notification système (in-app)
            notificationService.envoyerNotification(
                    sgl.getLogin(),
                    "⚠️ Défaut grave – Intervention obligatoire",
                    String.format("Un défaut grave a été enregistré pour le collaborateur %s. " +
                            "Votre participation au processus PAQ est obligatoire dès le niveau 1. " +
                            "Détail : %s", matricule, descriptionDefaut),
                    "DEFAUT_GRAVE",
                    matricule,
                    "EXPLICATIF"
            );

            // 2. Email
            if (sgl.getEmail() != null && !sgl.getEmail().isBlank()) {
                envoyerEmailDefautGrave(expediteurLogin, sgl.getEmail(), matricule, descriptionDefaut);
            }
        }

        log.info("[DefautGrave] {} SGL notifié(s) pour le matricule {}", sgls.size(), matricule);
    }

    // ──────────────────────────────────────────────────────────────────────────

    private void envoyerEmailDefautGrave(String expediteur, String destinataire,
                                         String matricule, String description) {
        try {
            String sujet = String.format("[PAQ – URGENT] Défaut grave – Collaborateur %s", matricule);
            String html = String.format("""
                <!DOCTYPE html>
                <html><head><meta charset="UTF-8"></head>
                <body style="font-family:Arial,sans-serif;">
                  <div style="max-width:600px;margin:auto;background:white;border-radius:8px;padding:20px;">
                    <div style="background:#b91c1c;padding:15px;border-radius:8px 8px 0 0;margin:-20px -20px 0 -20px;">
                      <h2 style="color:white;margin:0;">⚠️ PAQ – Défaut grave – Intervention obligatoire</h2>
                    </div>
                    <div style="padding:20px 0;">
                      <p>Bonjour,</p>
                      <p>Un <strong>défaut grave</strong> a été enregistré. Votre participation au processus PAQ
                         est <strong>obligatoire dès le premier niveau</strong>.</p>
                      <table style="width:100%%;border-collapse:collapse;margin:20px 0;">
                        <tr style="background:#fef2f2;">
                          <td style="padding:8px;border:1px solid #fca5a5;"><strong>Collaborateur (matricule)</strong></td>
                          <td style="padding:8px;border:1px solid #fca5a5;">%s</td>
                        </tr>
                        <tr>
                          <td style="padding:8px;border:1px solid #fca5a5;"><strong>Description du défaut</strong></td>
                          <td style="padding:8px;border:1px solid #fca5a5;">%s</td>
                        </tr>
                      </table>
                      <p style="color:#b91c1c;font-weight:bold;">
                        Veuillez vous connecter immédiatement au système PAQ pour prendre en charge ce dossier.
                      </p>
                    </div>
                    <div style="color:#666;font-size:12px;border-top:1px solid #eee;padding-top:10px;">
                      <p>Cet email est généré automatiquement par le système PAQ – LEONI.</p>
                    </div>
                  </div>
                </body></html>
                """, matricule, description);

            emailService.sendEmail(expediteur, destinataire, sujet, html);
        } catch (Exception e) {
            log.error("[DefautGrave] Erreur envoi email à {}: {}", destinataire, e.getMessage());
        }
    }
}