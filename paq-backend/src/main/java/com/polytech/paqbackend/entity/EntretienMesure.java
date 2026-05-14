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
    private LocalDate dateRequalification;
    private LocalDate dateCreation;
    private boolean alerteEnvoyee = false;


    private boolean valideParQM = false;
    private boolean valideParSGL = false;
    private LocalDate dateValidationQM;
    private LocalDate dateValidationSGL;

    // Getters et Setters


    public boolean isValideParSGL() {
        return valideParSGL;
    }

    public void setValideParSGL(boolean valideParSGL) {
        this.valideParSGL = valideParSGL;
    }

    public boolean isValideParQM() {
        return valideParQM;
    }

    public void setValideParQM(boolean valideParQM) {
        this.valideParQM = valideParQM;
    }

    public LocalDate getDateValidationQM() {
        return dateValidationQM;
    }

    public void setDateValidationQM(LocalDate dateValidationQM) {
        this.dateValidationQM = dateValidationQM;
    }

    public LocalDate getDateValidationSGL() {
        return dateValidationSGL;
    }

    public void setDateValidationSGL(LocalDate dateValidationSGL) {
        this.dateValidationSGL = dateValidationSGL;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getTypeFaute() { return typeFaute; }
    public void setTypeFaute(String typeFaute) { this.typeFaute = typeFaute; }

    public String getCausesPrincipales() { return causesPrincipales; }
    public void setCausesPrincipales(String causesPrincipales) { this.causesPrincipales = causesPrincipales; }

    public String getConvention() { return convention; }
    public void setConvention(String convention) { this.convention = convention; }

    public String getPlanAction() { return planAction; }
    public void setPlanAction(String planAction) { this.planAction = planAction; }

    public LocalDate getDateEntretien() { return dateEntretien; }
    public void setDateEntretien(LocalDate dateEntretien) { this.dateEntretien = dateEntretien; }

    public LocalDate getDateRequalification() { return dateRequalification; }
    public void setDateRequalification(LocalDate dateRequalification) { this.dateRequalification = dateRequalification; }

    public LocalDate getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDate dateCreation) { this.dateCreation = dateCreation; }

    public boolean isAlerteEnvoyee() { return alerteEnvoyee; }
    public void setAlerteEnvoyee(boolean alerteEnvoyee) { this.alerteEnvoyee = alerteEnvoyee; }
}