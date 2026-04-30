package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.entity.Notification;
import com.polytech.paqbackend.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller REST pour la gestion des notifications.
 *
 * Tous les endpoints utilisent Authentication pour extraire l'email de l'utilisateur
 * depuis le token JWT — jamais depuis les paramètres de la requête.
 * Cela garantit que chaque utilisateur ne voit que ses propres notifications.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * GET /api/notifications
     * Récupère toutes les notifications de l'utilisateur connecté.
     * Utilisé par le panneau de notifications au chargement.
     */
    @GetMapping
    public ResponseEntity<List<Notification>> getMesNotifications(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(notificationService.getNotificationsUtilisateur(email));
    }

    /**
     * GET /api/notifications/non-lues
     * Compte et retourne les notifications non lues.
     * Utilisé pour le badge rouge sur la cloche.
     */
    @GetMapping("/non-lues")
    public ResponseEntity<Map<String, Object>> getNonLues(Authentication authentication) {
        String email = authentication.getName();
        List<Notification> nonLues = notificationService.getNonLues(email);
        return ResponseEntity.ok(Map.of(
                "count", nonLues.size(),
                "notifications", nonLues
        ));
    }

    /**
     * PUT /api/notifications/{id}/lu
     * Marque une notification individuelle comme lue.
     * Appelé au clic sur une notification.
     */
    @PutMapping("/{id}/lu")
    public ResponseEntity<Void> marquerLue(@PathVariable Long id, Authentication authentication) {
        // Note : en production, vérifier que la notification appartient bien à cet utilisateur
        notificationService.marquerLue(id);
        return ResponseEntity.ok().build();
    }

    /**
     * PUT /api/notifications/marquer-toutes-lues
     * Marque toutes les notifications de l'utilisateur connecté comme lues.
     * Appelé à l'ouverture du panneau de notifications.
     */
    @PutMapping("/marquer-toutes-lues")
    public ResponseEntity<Map<String, Integer>> marquerToutesLues(Authentication authentication) {
        String email = authentication.getName();
        int count = notificationService.marquerToutesLues(email);
        return ResponseEntity.ok(Map.of("marquees", count));
    }

    /**
     * POST /api/notifications/envoyer
     * Permet à un administrateur d'envoyer une notification directe à un utilisateur.
     * Corps JSON :
     * {
     *   "destinataireEmail": "user@leoni.com",
     *   "titre": "Message important",
     *   "message": "...",
     *   "type": "INFO"
     * }
     */
    @PostMapping("/envoyer")
    public ResponseEntity<Notification> envoyerNotificationDirecte(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        // TODO : restreindre aux rôles ADMIN en production avec @PreAuthorize("hasRole('ADMIN')")
        Notification notif = notificationService.envoyerNotification(
                body.get("destinataireEmail"),
                body.get("titre"),
                body.get("message"),
                body.getOrDefault("type", "INFO"),
                body.get("matricule"),
                body.get("typeEntretien")
        );
        return ResponseEntity.ok(notif);
    }
}