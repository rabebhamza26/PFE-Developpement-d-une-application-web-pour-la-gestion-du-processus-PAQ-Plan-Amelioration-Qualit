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

    private String  collaboratorMatricule;

    private LocalDateTime createdAt;

    private int niveau;

    @Column(columnDefinition = "JSON")
    private String historique;

    public Long getId() { return id; }

    public String  getCollaboratorMatricule() { return collaboratorMatricule; }
    public void setCollaboratorMatricule(String  collaboratorMatricule) { this.collaboratorMatricule = collaboratorMatricule; }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public int getNiveau() { return niveau; }
    public void setNiveau(int niveau) { this.niveau = niveau; }

    public String getHistorique() { return historique; }
    public void setHistorique(String historique) { this.historique = historique; }
}