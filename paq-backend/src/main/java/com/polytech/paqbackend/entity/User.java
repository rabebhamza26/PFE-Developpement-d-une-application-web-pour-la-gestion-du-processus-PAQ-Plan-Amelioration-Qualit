package com.polytech.paqbackend.entity;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {


        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private String nomUtilisateur;

        @Column(unique = true)
        private String login;

        private String password;

        private boolean active = true; // ✔️ actif par défaut

        private LocalDateTime createdAt;

        @Enumerated(EnumType.STRING)
        private Role role;

        @PrePersist
        public void prePersist() {
            createdAt = LocalDateTime.now();
        }

    }