package com.polytech.paqbackend.dto;

public class PerformanceHistoryDTO {

    private String matricule;
    private String nom;
    private String periode;
    private int niveau;
    private String evolution; // AMELIORATION, STAGNATION, REGRESSION

    public PerformanceHistoryDTO() {}

    public PerformanceHistoryDTO(String matricule, String nom, String periode, int niveau, String evolution) {
        this.matricule = matricule;
        this.nom = nom;
        this.periode = periode;
        this.niveau = niveau;
        this.evolution = evolution;
    }

    // Getters and setters
    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPeriode() { return periode; }
    public void setPeriode(String periode) { this.periode = periode; }

    public int getNiveau() { return niveau; }
    public void setNiveau(int niveau) { this.niveau = niveau; }

    public String getEvolution() { return evolution; }
    public void setEvolution(String evolution) { this.evolution = evolution; }
}