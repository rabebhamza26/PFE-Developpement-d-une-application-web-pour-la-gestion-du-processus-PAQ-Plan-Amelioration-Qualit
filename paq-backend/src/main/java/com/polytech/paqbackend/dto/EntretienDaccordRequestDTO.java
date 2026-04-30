package com.polytech.paqbackend.dto;



import java.time.LocalDate;

public class EntretienDaccordRequestDTO {

    private LocalDate date;
    private String validationMesures;      // "Oui"/"Non"
    private String mesuresProposees;
    private String commentaireQMSegment;
    private String echanges;
    private String signatureSL;
    private String signatureQMSegment;
    private String destinataireEmail;

    private String typeFaute;

    public String getDestinataireEmail() {
        return destinataireEmail;
    }

    public void setDestinataireEmail(String destinataireEmail) {
        this.destinataireEmail = destinataireEmail;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getValidationMesures() { return validationMesures; }
    public void setValidationMesures(String validationMesures) { this.validationMesures = validationMesures; }

    public String getMesuresProposees() { return mesuresProposees; }
    public void setMesuresProposees(String mesuresProposees) { this.mesuresProposees = mesuresProposees; }

    public String getCommentaireQMSegment() {
        return commentaireQMSegment;
    }

    public void setCommentaireQMSegment(String commentaireQMSegment) {
        this.commentaireQMSegment = commentaireQMSegment;
    }

    public String getEchanges() { return echanges; }
    public void setEchanges(String echanges) { this.echanges = echanges; }

    public String getTypeFaute() {
        return typeFaute;
    }

    public void setTypeFaute(String typeFaute) {
        this.typeFaute = typeFaute;
    }

    public String getSignatureSL() { return signatureSL; }
    public void setSignatureSL(String signatureSL) { this.signatureSL = signatureSL; }

    public String getSignatureQMSegment() {
        return signatureQMSegment;
    }

    public void setSignatureQMSegment(String signatureQMSegment) {
        this.signatureQMSegment = signatureQMSegment;
    }
}
