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

    @Column(columnDefinition = "VARCHAR(10)")
    private String validationMesures; // "Oui" ou "Non"

    @Column(columnDefinition = "TEXT")
    private String mesuresProposees;

    @Column(columnDefinition = "TEXT")
    private String commentaireQMSegment;

    @Column(columnDefinition = "TEXT")
    private String echanges;

    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getTypeFaute() { return typeFaute; }
    public void setTypeFaute(String typeFaute) { this.typeFaute = typeFaute; }

    public String getValidationMesures() { return validationMesures; }
    public void setValidationMesures(String validationMesures) { this.validationMesures = validationMesures; }

    public String getMesuresProposees() { return mesuresProposees; }
    public void setMesuresProposees(String mesuresProposees) { this.mesuresProposees = mesuresProposees; }

    public String getCommentaireQMSegment() { return commentaireQMSegment; }
    public void setCommentaireQMSegment(String commentaireQM) { this.commentaireQMSegment = commentaireQM; }

    public String getEchanges() { return echanges; }
    public void setEchanges(String echanges) { this.echanges = echanges; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}