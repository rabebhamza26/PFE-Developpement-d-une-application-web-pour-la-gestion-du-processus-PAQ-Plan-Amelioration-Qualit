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

    List<Notification> findByDestinataireEmailOrderByCreatedAtDesc(String email);

    List<Notification> findByDestinataireEmailAndLuFalse(String email);

    long countByDestinataireEmailAndLuFalse(String email);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.lu = true WHERE n.destinataireEmail = :email")
    int marquerToutesLues(@Param("email") String email);
}