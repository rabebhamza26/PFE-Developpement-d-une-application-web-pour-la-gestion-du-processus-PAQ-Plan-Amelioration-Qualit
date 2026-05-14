package com.polytech.paqbackend.dto;

import java.time.LocalDate;

public class EntretienDaccordRequestDTO {

    private LocalDate date;
    private String mesuresProposees;
    private String commentaireQMSegment;
    private String destinataireEmail;
    private String typeFaute;
    private String causeFaute;

    public String getDestinataireEmail() {
        return destinataireEmail;
    }

    public void setDestinataireEmail(String destinataireEmail) {
        this.destinataireEmail = destinataireEmail;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getMesuresProposees() { return mesuresProposees; }
    public void setMesuresProposees(String mesuresProposees) { this.mesuresProposees = mesuresProposees; }

    public String getCommentaireQMSegment() {
        return commentaireQMSegment;
    }

    public void setCommentaireQMSegment(String commentaireQMSegment) {
        this.commentaireQMSegment = commentaireQMSegment;
    }

    public String getTypeFaute() {
        return typeFaute;
    }

    public void setTypeFaute(String typeFaute) {
        this.typeFaute = typeFaute;
    }

    public String getCauseFaute() {
        return causeFaute;
    }

    public void setCauseFaute(String causeFaute) {
        this.causeFaute = causeFaute;
    }
}