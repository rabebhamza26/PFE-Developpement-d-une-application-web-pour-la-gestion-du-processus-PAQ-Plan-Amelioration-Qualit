package com.polytech.paqbackend.dto;

import java.time.LocalDateTime;

public class NotificationDTO {
    private Long id;
    private String matricule;
    private String titre;
    private String message;
    private boolean lu;
    private LocalDateTime createdAt;
    private String type;
    private String typeEntretien;
    private String matriculeCollaborateur;
    private String nomCollaborateur;

    public NotificationDTO() {}

    public NotificationDTO(Long id, String matricule, String titre, String message,
                           boolean lu, LocalDateTime createdAt, String type,
                           String typeEntretien, String matriculeCollaborateur, String nomCollaborateur) {
        this.id = id;
        this.matricule = matricule;
        this.titre = titre;
        this.message = message;
        this.lu = lu;
        this.createdAt = createdAt;
        this.type = type;
        this.typeEntretien = typeEntretien;
        this.matriculeCollaborateur = matriculeCollaborateur;
        this.nomCollaborateur = nomCollaborateur;
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public boolean isLu() { return lu; }
    public void setLu(boolean lu) { this.lu = lu; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTypeEntretien() { return typeEntretien; }
    public void setTypeEntretien(String typeEntretien) { this.typeEntretien = typeEntretien; }

    public String getMatriculeCollaborateur() { return matriculeCollaborateur; }
    public void setMatriculeCollaborateur(String matriculeCollaborateur) { this.matriculeCollaborateur = matriculeCollaborateur; }

    public String getNomCollaborateur() { return nomCollaborateur; }
    public void setNomCollaborateur(String nomCollaborateur) { this.nomCollaborateur = nomCollaborateur; }
}