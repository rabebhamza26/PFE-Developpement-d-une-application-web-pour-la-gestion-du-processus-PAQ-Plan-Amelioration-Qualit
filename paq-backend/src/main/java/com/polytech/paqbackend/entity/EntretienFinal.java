package com.polytech.paqbackend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "entretien_final")
public class EntretienFinal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Matricule du collaborateur pour retrouver les entretiens par matricule
    @Column(nullable = false)
    private String matricule;

    private String decision;
    private LocalDate dateEntretien;
    private String typeFaute;

    @Column(columnDefinition = "TEXT")
    private String commentaireRH;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String signatureBase64;

    // ── Getters & Setters ────────────────────────────────────────────────
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getDecision() { return decision; }
    public void setDecision(String decision) { this.decision = decision; }

    public LocalDate getDateEntretien() { return dateEntretien; }
    public void setDateEntretien(LocalDate dateEntretien) { this.dateEntretien = dateEntretien; }

    public String getTypeFaute() { return typeFaute; }
    public void setTypeFaute(String typeFaute) { this.typeFaute = typeFaute; }

    public String getCommentaireRH() { return commentaireRH; }
    public void setCommentaireRH(String commentaireRH) { this.commentaireRH = commentaireRH; }

    public String getSignatureBase64() { return signatureBase64; }
    public void setSignatureBase64(String signatureBase64) { this.signatureBase64 = signatureBase64; }
}