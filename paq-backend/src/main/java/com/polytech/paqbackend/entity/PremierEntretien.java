package com.polytech.paqbackend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "premier_entretien")
public class PremierEntretien {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String matricule;
    private String typeFaute;
    private String gravite;
    private LocalDate dateFaute;
    @Column(columnDefinition="TEXT") private String description;
    @Column(columnDefinition="TEXT") private String mesuresCorrectives;
    @Column(columnDefinition="TEXT") private String commentaire;
    @Column(columnDefinition="LONGTEXT") private String signatureBase64;
    private String typeEntretien;
    private String createdBy;
    private LocalDateTime createdAt = LocalDateTime.now();

    // getters et setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMatricule() {
        return matricule;
    }

    public void setMatricule(String matricule) {
        this.matricule = matricule;
    }

    public String getTypeFaute() {
        return typeFaute;
    }

    public void setTypeFaute(String typeFaute) {
        this.typeFaute = typeFaute;
    }

    public String getGravite() {
        return gravite;
    }

    public void setGravite(String gravite) {
        this.gravite = gravite;
    }

    public LocalDate getDateFaute() {
        return dateFaute;
    }

    public void setDateFaute(LocalDate dateFaute) {
        this.dateFaute = dateFaute;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getMesuresCorrectives() {
        return mesuresCorrectives;
    }

    public void setMesuresCorrectives(String mesuresCorrectives) {
        this.mesuresCorrectives = mesuresCorrectives;
    }

    public String getCommentaire() {
        return commentaire;
    }

    public void setCommentaire(String commentaire) {
        this.commentaire = commentaire;
    }

    public String getSignatureBase64() {
        return signatureBase64;
    }

    public void setSignatureBase64(String signatureBase64) {
        this.signatureBase64 = signatureBase64;
    }

    public String getTypeEntretien() {
        return typeEntretien;
    }

    public void setTypeEntretien(String typeEntretien) {
        this.typeEntretien = typeEntretien;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}