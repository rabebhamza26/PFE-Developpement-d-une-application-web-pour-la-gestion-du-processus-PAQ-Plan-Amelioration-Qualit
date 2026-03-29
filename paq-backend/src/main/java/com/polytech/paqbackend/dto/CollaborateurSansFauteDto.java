package com.polytech.paqbackend.dto;

import java.time.LocalDate;

public class CollaborateurSansFauteDto {
    private String matricule;
    private String nom;
    private String prenom;  // Ajout du prénom
    private String segment;
    private LocalDate hireDate;
    private LocalDate derniereFaute;
    private long joursSansFaute;

    public CollaborateurSansFauteDto() {}

    public CollaborateurSansFauteDto(String matricule, String nom, String prenom,
                                     String segment, LocalDate hireDate,
                                     LocalDate derniereFaute, long joursSansFaute) {
        this.matricule = matricule;
        this.nom = nom;
        this.prenom = prenom;
        this.segment = segment;
        this.hireDate = hireDate;
        this.derniereFaute = derniereFaute;
        this.joursSansFaute = joursSansFaute;
    }

    // Getters et Setters
    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getSegment() { return segment; }
    public void setSegment(String segment) { this.segment = segment; }

    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate hireDate) { this.hireDate = hireDate; }

    public LocalDate getDerniereFaute() { return derniereFaute; }
    public void setDerniereFaute(LocalDate derniereFaute) { this.derniereFaute = derniereFaute; }

    public long getJoursSansFaute() { return joursSansFaute; }
    public void setJoursSansFaute(long joursSansFaute) { this.joursSansFaute = joursSansFaute; }
}