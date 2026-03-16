package com.polytech.paqbackend.repository;

import com.polytech.paqbackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByLogin(String login); // corrigé pour login
    long countByActiveTrue();
    long countByCreatedAtAfter(LocalDateTime dateTime);
}


