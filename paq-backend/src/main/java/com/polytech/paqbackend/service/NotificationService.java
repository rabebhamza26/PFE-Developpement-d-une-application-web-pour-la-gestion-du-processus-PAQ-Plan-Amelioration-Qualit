package com.polytech.paqbackend.service;

import com.polytech.paqbackend.entity.Notification;
import com.polytech.paqbackend.entity.User;
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
import java.util.Optional;
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

    // =========================================================
    // Résout le login canonique depuis un email OU un login.
    // Toutes les notifications sont indexées sur le LOGIN,
    // jamais sur l'email, pour éviter toute confusion.
    // =========================================================
    private String resolveLoginFromPrincipal(String principal) {
        if (principal == null || principal.isBlank()) return null;

        // Cherche dans les deux colonnes en une seule requête
        User user = userRepository.findByEmailOrLogin(principal);
        if (user != null && user.getLogin() != null) {
            return user.getLogin();
        }
        return principal; // fallback
    }

    // =========================================================
    // Envoie une notification à un utilisateur (BDD + WebSocket)
    // @param loginDestinataire  login canonique du destinataire
    // =========================================================
    @Transactional
    public Notification envoyerNotification(String loginDestinataire,
                                            String titre,
                                            String message,
                                            String type,
                                            String matriculeCollaborateur,
                                            String typeEntretien) {

        // Résoudre le login canonique (accepte email ou login en entrée)
        String loginCanonique = resolveLoginFromPrincipal(loginDestinataire);
        if (loginCanonique == null) {
            log.error("Impossible de résoudre le login pour : {}", loginDestinataire);
            return null;
        }

        User destinataire = userRepository.findByLogin(loginCanonique);
        if (destinataire == null) {
            log.error("Utilisateur non trouvé pour le login : {}", loginCanonique);
            return null;
        }

        String emailDestinataire = destinataire.getEmail();
        String nomUtilisateur    = destinataire.getNomUtilisateur();

        try {
            // 1. Sauvegarde en base — matricule = LOGIN canonique (clé de filtrage)
            Notification notif = new Notification();
            notif.setDestinataireEmail(emailDestinataire != null ? emailDestinataire : "");
            notif.setMatricule(loginCanonique);          // ← toujours le login
            notif.setTitre(titre);
            notif.setMessage(message);
            notif.setType(type != null ? type : "INFO");
            notif.setLu(false);
            notif.setCreatedAt(LocalDateTime.now());
            notif.setMatriculeCollaborateur(matriculeCollaborateur);
            notif.setTypeEntretien(typeEntretien);

            Notification saved = repo.save(notif);
            log.info("Notification sauvegardée pour login={}", loginCanonique);

            // 2. Push WebSocket — on envoie sur le login canonique
            messagingTemplate.convertAndSendToUser(
                    loginCanonique,
                    "/queue/notifications",
                    convertToDTO(saved, nomUtilisateur)
            );
            log.info("Notification WebSocket envoyée à login={}", loginCanonique);

            return saved;

        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la notification : {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Surcharge pratique : envoie par email (résout le login en interne).
     */
    public Notification envoyerNotification(String destinataireEmail,
                                            String titre,
                                            String message,
                                            String type) {
        User destinataire = userRepository.findByEmail(destinataireEmail);
        String login = destinataire != null ? destinataire.getLogin() : null;
        return envoyerNotification(login, titre, message, type, null, null);
    }

    // =========================================================
    // Lecture — filtre strict sur le login du user connecté
    // =========================================================

    public List<Map<String, Object>> getNotificationsByLogin(String login) {
        List<Notification> notifications = repo.findByMatriculeOrderByCreatedAtDesc(login);
        return notifications.stream()
                .map(n -> convertToDTO(n, getCollaboratorName(n.getMatriculeCollaborateur())))
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getUnreadNotificationsByLogin(String login) {
        List<Notification> notifications = repo.findByMatriculeAndLuOrderByCreatedAtDesc(login, false);
        return notifications.stream()
                .map(n -> convertToDTO(n, getCollaboratorName(n.getMatriculeCollaborateur())))
                .collect(Collectors.toList());
    }

    public long countUnreadByLogin(String login) {
        return repo.countByMatriculeAndLu(login, false);
    }

    // =========================================================
    // Écriture — vérification de propriété avant modification
    // =========================================================

    /**
     * Marque une notification comme lue SEULEMENT si elle appartient au login.
     * Empêche qu'un user marque les notifs d'un autre comme lues.
     */
    @Transactional
    public void markAsRead(Long id, String login) {
        Optional<Notification> notifOpt = repo.findById(id);
        if (notifOpt.isEmpty()) {
            log.warn("markAsRead : notification {} introuvable", id);
            return;
        }
        Notification notif = notifOpt.get();

        // Vérification de propriété
        if (!login.equals(notif.getMatricule())) {
            log.warn("markAsRead refusé : notif {} appartient à '{}', demandé par '{}'",
                    id, notif.getMatricule(), login);
            throw new SecurityException("Accès non autorisé à cette notification");
        }

        repo.markAsRead(id);
    }

    /**
     * Marque toutes les notifications du login comme lues.
     * La requête filtre sur le login → impossibilité de toucher celles d'autrui.
     */
    @Transactional
    public int markAllAsRead(String login) {
        repo.markAllAsRead(login);
        // Retourne 0 car toutes ont été marquées lues (plus d'unread)
        return 0;
    }

    // =========================================================
    // Utilitaires privés
    // =========================================================

    private String getCollaboratorName(String matriculeCollaborateur) {
        if (matriculeCollaborateur == null || matriculeCollaborateur.isBlank()) return "";
        User user = userRepository.findByLogin(matriculeCollaborateur);
        if (user != null && user.getNomUtilisateur() != null) {
            return user.getNomUtilisateur();
        }
        return matriculeCollaborateur;
    }

    private Map<String, Object> convertToDTO(Notification n, String nomCollaborateur) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id",                    n.getId());
        dto.put("matricule",             n.getMatricule());
        dto.put("titre",                 n.getTitre());
        dto.put("message",               n.getMessage());
        dto.put("lu",                    n.isLu());
        dto.put("createdAt",             n.getCreatedAt() != null ? n.getCreatedAt().toString() : null);
        dto.put("type",                  n.getType());
        dto.put("typeEntretien",         n.getTypeEntretien());
        dto.put("matriculeCollaborateur",n.getMatriculeCollaborateur());
        dto.put("nomCollaborateur",      nomCollaborateur);
        return dto;
    }
}