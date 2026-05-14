package com.polytech.paqbackend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "entretien_daccord")
public class EntretienDaccord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "VARCHAR(100)")
    private String typeFaute;

    private String matricule;
    private LocalDate date;

    @Column(columnDefinition = "TEXT")
    private String causeFaute;

    @Column(columnDefinition = "TEXT")
    private String mesuresProposees;

    @Column(columnDefinition = "TEXT")
    private String commentaireQMSegment;

    private LocalDateTime createdAt = LocalDateTime.now();

    private Boolean valide = false;


    // Getters et Setters

    public Boolean getValide() {
        return valide;
    }

    public void setValide(Boolean valide) {
        this.valide = valide;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getTypeFaute() { return typeFaute; }
    public void setTypeFaute(String typeFaute) { this.typeFaute = typeFaute; }

    public String getCauseFaute() { return causeFaute; }
    public void setCauseFaute(String causeFaute) { this.causeFaute = causeFaute; }

    public String getMesuresProposees() { return mesuresProposees; }
    public void setMesuresProposees(String mesuresProposees) { this.mesuresProposees = mesuresProposees; }

    public String getCommentaireQMSegment() { return commentaireQMSegment; }
    public void setCommentaireQMSegment(String commentaireQM) { this.commentaireQMSegment = commentaireQM; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}