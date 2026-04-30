package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller REST pour l'envoi manuel d'emails depuis l'interface React.
 * Accessible uniquement aux utilisateurs authentifiés.
 *
 * L'email de l'expéditeur est extrait du token JWT via Spring Security
 * (Authentication.getName() retourne le principal = email de l'utilisateur connecté).
 * On n'accepte JAMAIS l'email expéditeur depuis le corps de la requête
 * pour éviter l'usurpation d'identité.
 */
@RestController
@RequestMapping("/api/email")
public class EmailController {

    private final EmailService emailService;

    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    /**
     * POST /api/email/send
     * Corps JSON attendu :
     * {
     *   "destinataireEmail": "qm.segment@leoni.com",
     *   "sujet": "Validation entretien",
     *   "contenu": "<p>HTML content</p>"
     * }
     *
     * @param authentication injecté par Spring Security depuis le JWT Bearer token
     */
    @PostMapping("/send")
    public ResponseEntity<Map<String, String>> sendEmail(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        // Récupère l'email depuis le token JWT (jamais depuis le body)
        String expediteurEmail = authentication.getName();

        String destinataireEmail = body.get("destinataireEmail");
        String sujet = body.get("sujet");
        String contenu = body.getOrDefault("contenu", "<p>Notification PAQ</p>");

        if (destinataireEmail == null || destinataireEmail.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "destinataireEmail requis"));
        }

        // L'envoi mémorise automatiquement expediteur → destinataire dans EmailPendingStore
        emailService.sendEmail(expediteurEmail, destinataireEmail, sujet, contenu);

        return ResponseEntity.ok(Map.of(
                "statut", "envoyé",
                "destinataire", destinataireEmail,
                "expediteur", expediteurEmail
        ));
    }
}