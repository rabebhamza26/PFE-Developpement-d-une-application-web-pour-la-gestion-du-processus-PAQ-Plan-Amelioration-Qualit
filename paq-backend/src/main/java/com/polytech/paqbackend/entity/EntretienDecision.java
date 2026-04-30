package com.polytech.paqbackend.entity;


import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "entretien_decision")
public class EntretienDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String matricule;
    private String typeFaute;
    private LocalDate dateEntretien;



    @Column(columnDefinition = "TEXT")
    private String decision;

    @Column(columnDefinition = "TEXT")
    private String justification;

    @Column(columnDefinition = "LONGTEXT")
    private String signatureSL;

    @Column(columnDefinition = "LONGTEXT")
    private String signatureQM;

    @Column(columnDefinition = "LONGTEXT")
    private String signatureSGL;

    private LocalDate dateCreation;

    // GETTERS & SETTERS
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getTypeFaute() { return typeFaute; }
    public void setTypeFaute(String typeFaute) { this.typeFaute = typeFaute; }

    public LocalDate getDateEntretien() { return dateEntretien; }
    public void setDateEntretien(LocalDate dateEntretien) { this.dateEntretien = dateEntretien; }



    public String getDecision() { return decision; }
    public void setDecision(String decision) { this.decision = decision; }

    public String getJustification() { return justification; }
    public void setJustification(String justification) { this.justification = justification; }

    public String getSignatureSL() { return signatureSL; }
    public void setSignatureSL(String signatureSL) { this.signatureSL = signatureSL; }

    public String getSignatureQM() { return signatureQM; }
    public void setSignatureQM(String signatureQM) { this.signatureQM = signatureQM; }

    public String getSignatureSGL() { return signatureSGL; }
    public void setSignatureSGL(String signatureSGL) { this.signatureSGL = signatureSGL; }

    public LocalDate getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDate dateCreation) { this.dateCreation = dateCreation; }
}