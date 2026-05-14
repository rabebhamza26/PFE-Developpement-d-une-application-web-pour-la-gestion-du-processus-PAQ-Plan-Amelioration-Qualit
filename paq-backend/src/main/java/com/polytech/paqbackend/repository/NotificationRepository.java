package com.polytech.paqbackend.repository;

import com.polytech.paqbackend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // ── Lecture ──────────────────────────────────────────────
    // Toutes les requêtes filtrent sur `matricule` (= login du destinataire).
    // Un user ne peut donc jamais lire les notifs d'un autre.

    List<Notification> findByMatriculeOrderByCreatedAtDesc(String matricule);

    List<Notification> findByMatriculeAndLuOrderByCreatedAtDesc(String matricule, boolean lu);

    long countByMatriculeAndLu(String matricule, boolean lu);

    Optional<Notification> findByIdAndMatricule(Long id, String matricule);

    // ── Écriture ─────────────────────────────────────────────

    /**
     * Marque toutes les notifications d'un login comme lues.
     * Le WHERE sur matricule garantit qu'on ne touche que les notifs du propriétaire.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.lu = true WHERE n.matricule = :matricule AND n.lu = false")
    void markAllAsRead(@Param("matricule") String matricule);

    /**
     * Marque une notification comme lue — vérification de propriété incluse.
     * Utiliser le service (qui vérifie l'ownership) plutôt qu'appeler cette méthode directement.
     */
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.lu = true WHERE n.id = :id")
    void markAsRead(@Param("id") Long id);
}