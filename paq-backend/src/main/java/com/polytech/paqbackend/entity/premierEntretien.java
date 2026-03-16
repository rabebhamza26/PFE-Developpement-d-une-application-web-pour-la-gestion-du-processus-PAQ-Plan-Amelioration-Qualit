package com.polytech.paqbackend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import java.time.LocalDate;
@Entity
public class premierEntretien {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String typeFaute;
    private String gravite;
    private String source;
    private String poste;

    private String description;
    private String mesuresCorrectives;
    private String commentaire;

    private LocalDate dateFaute;

    private int quantiteNonConforme;

    private String signature;

    private Long dossierId;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getPoste() {
        return poste;
    }

    public void setPoste(String poste) {
        this.poste = poste;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getDossierId() {
        return dossierId;
    }

    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }

    public int getQuantiteNonConforme() {
        return quantiteNonConforme;
    }

    public void setQuantiteNonConforme(int quantiteNonConforme) {
        this.quantiteNonConforme = quantiteNonConforme;
    }

    public LocalDate getDateFaute() {
        return dateFaute;
    }

    public void setDateFaute(LocalDate dateFaute) {
        this.dateFaute = dateFaute;
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
}
