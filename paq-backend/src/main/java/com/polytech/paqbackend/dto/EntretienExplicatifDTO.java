package com.polytech.paqbackend.dto;

import java.time.LocalDate;

public class EntretienExplicatifDTO {
    private String typeFaute;
    private LocalDate date;
    private String description;
    private String mesuresCorrectives;
    private String notes;
    private String signatureBase64;
    private String destinataireEmail; // Nouveau champ pour l'email saisi par l'utilisateur

    // Getters et Setters
    public String getTypeFaute() { return typeFaute; }
    public void setTypeFaute(String typeFaute) { this.typeFaute = typeFaute; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getMesuresCorrectives() { return mesuresCorrectives; }
    public void setMesuresCorrectives(String mesuresCorrectives) { this.mesuresCorrectives = mesuresCorrectives; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }



    public String getSignatureBase64() { return signatureBase64; }
    public void setSignatureBase64(String signatureBase64) { this.signatureBase64 = signatureBase64; }

    public String getDestinataireEmail() { return destinataireEmail; }
    public void setDestinataireEmail(String destinataireEmail) { this.destinataireEmail = destinataireEmail; }
}