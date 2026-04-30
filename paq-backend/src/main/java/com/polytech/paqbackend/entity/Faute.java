package com.polytech.paqbackend.entity;


import jakarta.persistence.*;

@Entity
@Table(name = "fautes")
public class Faute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    public Faute() {}

    public Faute(String nom) {
        this.nom = nom;
    }

    public Long getId() { return id; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
}