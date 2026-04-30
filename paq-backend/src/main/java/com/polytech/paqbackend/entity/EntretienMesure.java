package com.polytech.paqbackend.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "entretien_mesure")
public class EntretienMesure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String matricule;
    private String typeFaute;

    @Column(columnDefinition = "TEXT")
    private String causesPrincipales;

    @Column(columnDefinition = "TEXT")
    private String convention;

    @Column(columnDefinition = "TEXT")
    private String planAction;

    private LocalDate dateEntretien;
    private LocalDate dateRequalification; // ✅ CHAMP PRINCIPAL

    private LocalDate dateCreation;

    @Column(columnDefinition = "LONGTEXT")
    private String signatureSL;

    @Column(columnDefinition = "LONGTEXT")
    private String signatureQMSegment;

    @Column(columnDefinition = "LONGTEXT")
    private String signatureSGL;

    private boolean alerteEnvoyee = false;

    // getters/setters

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

    public String getCausesPrincipales() {
        return causesPrincipales;
    }

    public void setCausesPrincipales(String causesPrincipales) {
        this.causesPrincipales = causesPrincipales;
    }

    public String getConvention() {
        return convention;
    }

    public void setConvention(String convention) {
        this.convention = convention;
    }

    public String getPlanAction() {
        return planAction;
    }

    public void setPlanAction(String planAction) {
        this.planAction = planAction;
    }

    public LocalDate getDateEntretien() {
        return dateEntretien;
    }

    public void setDateEntretien(LocalDate dateEntretien) {
        this.dateEntretien = dateEntretien;
    }

    public LocalDate getDateRequalification() {
        return dateRequalification;
    }

    public void setDateRequalification(LocalDate dateRequalification) {
        this.dateRequalification = dateRequalification;
    }

    public LocalDate getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDate dateCreation) {
        this.dateCreation = dateCreation;
    }

    public String getSignatureSL() {
        return signatureSL;
    }

    public void setSignatureSL(String signatureSL) {
        this.signatureSL = signatureSL;
    }

    public String getSignatureQMSegment() {
        return signatureQMSegment;
    }

    public void setSignatureQMSegment(String signatureQMSegment) {
        this.signatureQMSegment = signatureQMSegment;
    }

    public String getSignatureSGL() {
        return signatureSGL;
    }

    public void setSignatureSGL(String signatureSGL) {
        this.signatureSGL = signatureSGL;
    }

    public boolean isAlerteEnvoyee() {
        return alerteEnvoyee;
    }

    public void setAlerteEnvoyee(boolean alerteEnvoyee) {
        this.alerteEnvoyee = alerteEnvoyee;
    }
}
