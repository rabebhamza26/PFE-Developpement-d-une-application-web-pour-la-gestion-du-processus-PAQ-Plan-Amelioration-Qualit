package com.polytech.paqbackend.dto;

import java.time.LocalDate;

public class EntretienDecisionRequestDTO {
    private String typeFaute;
    private LocalDate dateEntretien;
    private String synthese;
    private String decision;
    private String justification;

    private String signatureSL;
    private String signatureQM;
    private String signatureSGL;
    private String destinataireEmail;

    // GETTERS & SETTERS
    public String getTypeFaute() { return typeFaute; }
    public void setTypeFaute(String typeFaute) { this.typeFaute = typeFaute; }

    public LocalDate getDateEntretien() { return dateEntretien; }
    public void setDateEntretien(LocalDate dateEntretien) { this.dateEntretien = dateEntretien; }

    public String getDestinataireEmail() {
        return destinataireEmail;
    }

    public void setDestinataireEmail(String destinataireEmail) {
        this.destinataireEmail = destinataireEmail;
    }

    public String getSynthese() { return synthese; }
    public void setSynthese(String synthese) { this.synthese = synthese; }

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
}
