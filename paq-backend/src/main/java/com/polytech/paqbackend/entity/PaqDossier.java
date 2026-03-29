package com.polytech.paqbackend.entity;


import jakarta.persistence.*;
        import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "paq_dossier")
public class PaqDossier {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String collaboratorMatricule;

    private LocalDate derniereFaute;
    private LocalDate dateCreation;
    private LocalDate dateFin;
    private boolean actif = true;
    private LocalDateTime createdAt;
    private int niveau = 0;

    @Column(name = "statut")
    private String statut = "EN_COURS";

    private boolean archived = false;

    @Column(columnDefinition = "TEXT")
    private String historique;

    // Champs pour les entretiens
    private LocalDate datePremierEntretien;
    private String premierEntretienNotes;

    private LocalDate dateDeuxiemeEntretien;
    private String deuxiemeEntretienNotes;

    private LocalDate dateTroisiemeEntretien;
    private String troisiemeEntretienNotes;

    private LocalDate dateQuatriemeEntretien;
    private String quatriemeEntretienNotes;

    private LocalDate dateCinquiemeEntretien;
    private String cinquiemeEntretienNotes;

    // Constructeurs
    public PaqDossier() {}

    public PaqDossier(String collaboratorMatricule) {
        this.collaboratorMatricule = collaboratorMatricule;
        this.dateCreation = LocalDate.now();
        this.dateFin = LocalDate.now().plusMonths(6);
        this.createdAt = LocalDateTime.now();
        this.niveau = 0;
        this.statut = "EN_COURS";
        this.actif = true;
        this.archived = false;
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCollaboratorMatricule() { return collaboratorMatricule; }
    public void setCollaboratorMatricule(String collaboratorMatricule) {
        this.collaboratorMatricule = collaboratorMatricule;
    }

    public LocalDate getDerniereFaute() { return derniereFaute; }
    public void setDerniereFaute(LocalDate derniereFaute) { this.derniereFaute = derniereFaute; }

    public LocalDate getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDate dateCreation) { this.dateCreation = dateCreation; }

    public LocalDate getDateFin() { return dateFin; }
    public void setDateFin(LocalDate dateFin) { this.dateFin = dateFin; }

    public boolean isActif() { return actif; }
    public void setActif(boolean actif) { this.actif = actif; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public int getNiveau() { return niveau; }
    public void setNiveau(int niveau) { this.niveau = niveau; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public boolean isArchived() { return archived; }
    public void setArchived(boolean archived) { this.archived = archived; }

    public String getHistorique() { return historique; }
    public void setHistorique(String historique) { this.historique = historique; }

    public LocalDate getDatePremierEntretien() { return datePremierEntretien; }
    public void setDatePremierEntretien(LocalDate datePremierEntretien) {
        this.datePremierEntretien = datePremierEntretien;
    }

    public String getPremierEntretienNotes() { return premierEntretienNotes; }
    public void setPremierEntretienNotes(String premierEntretienNotes) {
        this.premierEntretienNotes = premierEntretienNotes;
    }

    public LocalDate getDateDeuxiemeEntretien() { return dateDeuxiemeEntretien; }
    public void setDateDeuxiemeEntretien(LocalDate dateDeuxiemeEntretien) {
        this.dateDeuxiemeEntretien = dateDeuxiemeEntretien;
    }

    public String getDeuxiemeEntretienNotes() { return deuxiemeEntretienNotes; }
    public void setDeuxiemeEntretienNotes(String deuxiemeEntretienNotes) {
        this.deuxiemeEntretienNotes = deuxiemeEntretienNotes;
    }

    public LocalDate getDateTroisiemeEntretien() { return dateTroisiemeEntretien; }
    public void setDateTroisiemeEntretien(LocalDate dateTroisiemeEntretien) {
        this.dateTroisiemeEntretien = dateTroisiemeEntretien;
    }

    public String getTroisiemeEntretienNotes() { return troisiemeEntretienNotes; }
    public void setTroisiemeEntretienNotes(String troisiemeEntretienNotes) {
        this.troisiemeEntretienNotes = troisiemeEntretienNotes;
    }

    public LocalDate getDateQuatriemeEntretien() { return dateQuatriemeEntretien; }
    public void setDateQuatriemeEntretien(LocalDate dateQuatriemeEntretien) {
        this.dateQuatriemeEntretien = dateQuatriemeEntretien;
    }

    public String getQuatriemeEntretienNotes() { return quatriemeEntretienNotes; }
    public void setQuatriemeEntretienNotes(String quatriemeEntretienNotes) {
        this.quatriemeEntretienNotes = quatriemeEntretienNotes;
    }

    public LocalDate getDateCinquiemeEntretien() { return dateCinquiemeEntretien; }
    public void setDateCinquiemeEntretien(LocalDate dateCinquiemeEntretien) {
        this.dateCinquiemeEntretien = dateCinquiemeEntretien;
    }

    public String getCinquiemeEntretienNotes() { return cinquiemeEntretienNotes; }
    public void setCinquiemeEntretienNotes(String cinquiemeEntretienNotes) {
        this.cinquiemeEntretienNotes = cinquiemeEntretienNotes;
    }
}
