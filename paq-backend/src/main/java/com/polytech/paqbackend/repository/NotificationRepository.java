package com.polytech.paqbackend.repository;

import com.polytech.paqbackend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByMatriculeOrderByCreatedAtDesc(String matricule);

    List<Notification> findByMatriculeAndLuOrderByCreatedAtDesc(String matricule, boolean lu);

    long countByMatriculeAndLu(String matricule, boolean lu);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.lu = true WHERE n.matricule = :matricule")
    void markAllAsRead(@Param("matricule") String matricule);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.lu = true WHERE n.id = :id")
    void markAsRead(@Param("id") Long id);
}