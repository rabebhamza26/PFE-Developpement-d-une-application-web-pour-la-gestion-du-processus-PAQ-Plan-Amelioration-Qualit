package com.polytech.paqbackend.dto;

import java.time.LocalDate;

public class EntretienMesureRequestDTO {
    private String typeFaute;
    private String causesPrincipales;
    private String convention;
    private String planAction;

    private LocalDate dateEntretien;

    private String destinataireEmail;



    private LocalDate dateRequalification;

    private String signatureSL;
    private String signatureQMSegment;
    private String signatureSGL;

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

    public String getDestinataireEmail() {
        return destinataireEmail;
    }

    public void setDestinataireEmail(String destinataireEmail) {
        this.destinataireEmail = destinataireEmail;
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
}