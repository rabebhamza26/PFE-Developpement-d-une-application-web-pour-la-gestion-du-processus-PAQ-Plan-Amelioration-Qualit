package com.polytech.paqbackend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "archive")
public class Archive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type;         // Type d'entretien (ex: "Entretien Explicatif", "PAQ", …)
    private String matricule;    // Matricule du collaborateur
    private String nomPrenom;    // Nom complet
    private LocalDate dateArchivage;
    private Long paqDossierId;   // Référence vers le dossier PAQ source

    // ── Champs enrichis pour export PDF ──
    private Integer niveau;          // Niveau atteint au moment de l'archivage
    private String statut;           // Statut final (ARCHIVE, CLOTURE, …)

    @Column(columnDefinition = "TEXT")
    private String historique;       // JSON des événements du PAQ archivé

    private LocalDate dateCreation;  // Début de la période PAQ
    private LocalDate dateFin;       // Fin de la période PAQ

    // ─────────── Getters & Setters ───────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getNomPrenom() { return nomPrenom; }
    public void setNomPrenom(String nomPrenom) { this.nomPrenom = nomPrenom; }

    public LocalDate getDateArchivage() { return dateArchivage; }
    public void setDateArchivage(LocalDate dateArchivage) { this.dateArchivage = dateArchivage; }

    public Long getPaqDossierId() { return paqDossierId; }
    public void setPaqDossierId(Long paqDossierId) { this.paqDossierId = paqDossierId; }

    public Integer getNiveau() { return niveau; }
    public void setNiveau(Integer niveau) { this.niveau = niveau; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public String getHistorique() { return historique; }
    public void setHistorique(String historique) { this.historique = historique; }

    public LocalDate getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDate dateCreation) { this.dateCreation = dateCreation; }

    public LocalDate getDateFin() { return dateFin; }
    public void setDateFin(LocalDate dateFin) { this.dateFin = dateFin; }
}