package com.polytech.paqbackend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "segments")
@Data
@AllArgsConstructor
@Builder

public class Segment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idSegment;

    @Column(nullable = false)
    private String nomSegment;

    // Constructeurs
    public Segment() {}
    public Segment(String nomSegment) {
        this.nomSegment = nomSegment;
    }

    // Getters & Setters
    public Long getIdSegment() {
        return idSegment;
    }

    public void setIdSegment(Long idSegment) {
        this.idSegment = idSegment;
    }

    public String getNomSegment() {
        return nomSegment;
    }

    public void setNomSegment(String nomSegment) {
        this.nomSegment = nomSegment;
    }
}
