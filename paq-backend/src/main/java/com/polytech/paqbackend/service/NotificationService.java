package com.polytech.paqbackend.service;

import com.polytech.paqbackend.entity.Notification;
import com.polytech.paqbackend.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository repo;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository repo,
                               SimpMessagingTemplate messagingTemplate) {
        this.repo = repo;
        this.messagingTemplate = messagingTemplate;
    }

    public Notification envoyerNotification(String destinataireEmail,
                                            String titre,
                                            String message,
                                            String type,
                                            String matricule,
                                            String typeEntretien) {

        // Vérification critique
        if (destinataireEmail == null || destinataireEmail.isBlank()) {
            log.error("destinataireEmail est null ou vide");
            throw new IllegalArgumentException("Le destinataire email ne peut pas être null");
        }

        try {
            Notification notif = new Notification();
            notif.setDestinataireEmail(destinataireEmail);
            notif.setTitre(titre);
            notif.setMessage(message);
            notif.setType(type != null ? type : "INFO");
            notif.setLu(false);
            notif.setCreatedAt(java.time.LocalDateTime.now());
            notif.setMatricule(matricule);
            notif.setTypeEntretien(typeEntretien);

            Notification saved = repo.save(notif);
            log.info("Notification sauvegardée pour {}", destinataireEmail);

            messagingTemplate.convertAndSendToUser(
                    destinataireEmail,
                    "/queue/notifications",
                    toPayload(saved)
            );

            return saved;

        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la notification: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur: " + e.getMessage(), e);
        }
    }

    public Notification envoyerNotification(String destinataireEmail,
                                            String titre,
                                            String message,
                                            String type) {
        return envoyerNotification(destinataireEmail, titre, message, type, null, null);
    }

    public List<Notification> getNotificationsUtilisateur(String email) {
        return repo.findByDestinataireEmailOrderByCreatedAtDesc(email);
    }

    public List<Notification> getNonLues(String email) {
        return repo.findByDestinataireEmailAndLuFalse(email);
    }

    public long compterNonLues(String email) {
        return repo.countByDestinataireEmailAndLuFalse(email);
    }

    public void marquerLue(Long id) {
        repo.findById(id).ifPresent(n -> {
            n.setLu(true);
            repo.save(n);
        });
    }

    public int marquerToutesLues(String email) {
        return repo.marquerToutesLues(email);
    }

    private Map<String, Object> toPayload(Notification n) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", n.getId());
        payload.put("titre", n.getTitre());
        payload.put("message", n.getMessage());
        payload.put("type", n.getType());
        payload.put("lu", n.isLu());
        payload.put("createdAt", n.getCreatedAt().toString());
        payload.put("matricule", n.getMatricule() != null ? n.getMatricule() : "");
        payload.put("typeEntretien", n.getTypeEntretien() != null ? n.getTypeEntretien() : "");
        return payload;
    }
}