package com.polytech.paqbackend.entity;



import jakarta.persistence.*;
        import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "entretien_positif")
public class EntretienPositif {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private String matriculeCollaborateur;
        private String slDestinataire;
        private LocalDate dateEnvoi;
        private String note;

        private LocalDateTime createdAt;

        // getters/setters


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMatriculeCollaborateur() {
        return matriculeCollaborateur;
    }

    public void setMatriculeCollaborateur(String matriculeCollaborateur) {
        this.matriculeCollaborateur = matriculeCollaborateur;
    }

    public String getSlDestinataire() {
        return slDestinataire;
    }

    public void setSlDestinataire(String slDestinataire) {
        this.slDestinataire = slDestinataire;
    }

    public LocalDate getDateEnvoi() {
        return dateEnvoi;
    }

    public void setDateEnvoi(LocalDate dateEnvoi) {
        this.dateEnvoi = dateEnvoi;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

