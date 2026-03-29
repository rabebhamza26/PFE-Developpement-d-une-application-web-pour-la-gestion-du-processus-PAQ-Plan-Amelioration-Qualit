package com.polytech.paqbackend.repository;

import com.polytech.paqbackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    long countByActiveFalse();
    User findByLogin(String login); // corrigé pour login
    long countByActiveTrue();
    long countByCreatedAtAfter(LocalDateTime dateTime);


        @Query("select u.role, count(u) from User u group by u.role")
        List<Object[]> countUsersByRole();


}


