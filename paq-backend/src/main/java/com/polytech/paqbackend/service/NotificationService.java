package com.polytech.paqbackend.service;

import com.polytech.paqbackend.entity.User;
import com.polytech.paqbackend.entity.Notification;
import com.polytech.paqbackend.repository.NotificationRepository;
import com.polytech.paqbackend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository repo;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository repo,
                               UserRepository userRepository,
                               SimpMessagingTemplate messagingTemplate) {
        this.repo = repo;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Envoie une notification à un utilisateur (système + WebSocket)
     */
    @Transactional
    public Notification envoyerNotification(String matriculeDestinataire,
                                            String titre,
                                            String message,
                                            String type,
                                            String matriculeCollaborateur,
                                            String typeEntretien) {

        // Récupérer l'utilisateur par son login/matricule
        User destinataire = getUserByLogin(matriculeDestinataire);
        String emailDestinataire = destinataire != null ? destinataire.getEmail() : null;
        String nomUtilisateur = destinataire != null ? destinataire.getNomUtilisateur() : matriculeDestinataire;

        if (emailDestinataire == null) {
            log.error("Utilisateur non trouvé pour le login: {}", matriculeDestinataire);
            return null;
        }

        try {
            // 1. Sauvegarder dans la base de données
            Notification notif = new Notification();
            notif.setDestinataireEmail(emailDestinataire);
            notif.setMatricule(matriculeDestinataire);
            notif.setTitre(titre);
            notif.setMessage(message);
            notif.setType(type != null ? type : "INFO");
            notif.setLu(false);
            notif.setCreatedAt(LocalDateTime.now());
            notif.setMatriculeCollaborateur(matriculeCollaborateur);
            notif.setTypeEntretien(typeEntretien);

            Notification saved = repo.save(notif);
            log.info("Notification sauvegardée pour {} ({})", matriculeDestinataire, emailDestinataire);

            // 2. Envoyer via WebSocket en temps réel
            messagingTemplate.convertAndSendToUser(
                    matriculeDestinataire,  // Utiliser le login comme identifiant
                    "/queue/notifications",
                    convertToDTO(saved, nomUtilisateur)
            );

            log.info("Notification WebSocket envoyée à {}", matriculeDestinataire);

            return saved;

        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la notification: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Envoie une notification simple par email
     */
    public Notification envoyerNotification(String destinataireEmail,
                                            String titre,
                                            String message,
                                            String type) {
        // Récupérer l'utilisateur par email
        User destinataire = getUserByEmail(destinataireEmail);
        String matricule = destinataire != null ? destinataire.getLogin() : null;

        return envoyerNotification(matricule, titre, message, type, null, null);
    }

    /**
     * Récupère toutes les notifications d'un utilisateur
     */
    public List<Map<String, Object>> getNotificationsByLogin(String login) {
        List<Notification> notifications = repo.findByMatriculeOrderByCreatedAtDesc(login);

        return notifications.stream().map(notif -> {
            String nomUtilisateur = getUserNameByLogin(notif.getMatriculeCollaborateur());
            return convertToDTO(notif, nomUtilisateur);
        }).collect(Collectors.toList());
    }

    /**
     * Récupère les notifications non lues d'un utilisateur
     */
    public List<Map<String, Object>> getUnreadNotificationsByLogin(String login) {
        List<Notification> notifications = repo.findByMatriculeAndLuOrderByCreatedAtDesc(login, false);

        return notifications.stream().map(notif -> {
            String nomUtilisateur = getUserNameByLogin(notif.getMatriculeCollaborateur());
            return convertToDTO(notif, nomUtilisateur);
        }).collect(Collectors.toList());
    }

    /**
     * Compte les notifications non lues
     */
    public long countUnreadByLogin(String login) {
        return repo.countByMatriculeAndLu(login, false);
    }

    /**
     * Marque une notification comme lue
     */
    @Transactional
    public void markAsRead(Long id, String login) {
        repo.markAsRead(id);
    }

    /**
     * Marque toutes les notifications comme lues
     */
    @Transactional
    public int markAllAsRead(String login) {
        repo.markAllAsRead(login);
        return (int) repo.countByMatriculeAndLu(login, false);
    }

    // Méthodes utilitaires - CORRIGÉES pour utiliser les méthodes du repository
    private User getUserByLogin(String login) {
        if (login == null) return null;
        // UserRepository.findByLogin retourne User directement, pas Optional
        User user = userRepository.findByLogin(login);
        return user;
    }

    private User getUserByEmail(String email) {
        if (email == null) return null;
        // UserRepository.findByEmail retourne User directement, pas Optional
        User user = userRepository.findByEmail(email);
        return user;
    }

    private String getUserNameByLogin(String login) {
        if (login == null) return "";
        User user = userRepository.findByLogin(login);
        if (user != null) {
            return user.getNomUtilisateur();
        }
        return login;
    }

    private String convertToJson(Map<String, String> data) {
        try {
            StringBuilder sb = new StringBuilder("{");
            int i = 0;
            for (Map.Entry<String, String> entry : data.entrySet()) {
                if (i++ > 0) sb.append(",");
                sb.append("\"").append(entry.getKey()).append("\":\"")
                        .append(entry.getValue().replace("\"", "\\\"")).append("\"");
            }
            sb.append("}");
            return sb.toString();
        } catch (Exception e) {
            return "{}";
        }
    }

    private Map<String, Object> convertToDTO(Notification n, String nomUtilisateur) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", n.getId());
        dto.put("matricule", n.getMatricule());
        dto.put("titre", n.getTitre());
        dto.put("message", n.getMessage());
        dto.put("lu", n.isLu());
        dto.put("createdAt", n.getCreatedAt().toString());
        dto.put("type", n.getType());
        dto.put("typeEntretien", n.getTypeEntretien());
        dto.put("matriculeCollaborateur", n.getMatriculeCollaborateur());
        dto.put("nomCollaborateur", nomUtilisateur);
        return dto;
    }
}