package com.polytech.paqbackend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "collaborators")
public class Collaborator {

    @Id
    private String matricule;

    private String name;
    private String prenom;
    private LocalDate hireDate;
    private String segment;
    private int niveau = 0;
    private String status = "ACTIF";
    private boolean archived = false;
    private boolean actif = true;
    private boolean depart = false;

    // Add departDate field
    private LocalDate departDate;

    // Constructeurs
    public Collaborator() {}

    public Collaborator(String matricule, String name, String prenom,
                        LocalDate hireDate, String segment) {
        this.matricule = matricule;
        this.name = name;
        this.prenom = prenom;
        this.hireDate = hireDate;
        this.segment = segment;
        this.niveau = 0;
        this.status = "ACTIF";
        this.actif = true;
        this.archived = false;
        this.depart = false;
    }

    // Getters et Setters
    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate hireDate) { this.hireDate = hireDate; }

    public String getSegment() { return segment; }
    public void setSegment(String segment) { this.segment = segment; }

    public int getNiveau() { return niveau; }
    public void setNiveau(int niveau) { this.niveau = niveau; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isArchived() { return archived; }
    public void setArchived(boolean archived) { this.archived = archived; }

    public boolean isActif() { return actif; }
    public void setActif(boolean actif) { this.actif = actif; }

    public boolean isDepart() { return depart; }
    public void setDepart(boolean depart) { this.depart = depart; }

    public LocalDate getDepartDate() { return departDate; }
    public void setDepartDate(LocalDate departDate) { this.departDate = departDate; }
}