package com.polytech.paqbackend.entity;




import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "collaborators")
public class Collaborator {

    @Id
    private String  matricule;

    private String name;

    private LocalDate hireDate;

    private String segment;

    private int niveau = 0;

    private String status = "ACTIF";

    private boolean archived = false;
    private boolean actif;

    public boolean isActif() {
        return actif;
    }

    public void setActif(boolean actif) {
        this.actif = actif;
    }

    public String  getMatricule() { return matricule; }
    public void setMatricule(String  matricule) { this.matricule = matricule; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate hireDate) { this.hireDate = hireDate; }

    public String getSegment() { return segment; }
    public void setSegment(String segment) { this.segment = segment; }

    public int getNiveau() { return niveau; }
    public void setNiveau(int niveau) { this.niveau = niveau; }

    public boolean isArchived() { return archived; }
    public void setArchived(boolean archived) { this.archived = archived; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
