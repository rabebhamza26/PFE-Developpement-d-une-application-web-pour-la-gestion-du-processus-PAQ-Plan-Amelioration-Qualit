package com.polytech.paqbackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "segments",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"nomSegment", "plant_id"})
        })
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Segment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idSegment;

    @Column(nullable = false)
    private String nomSegment;

    @ManyToMany(mappedBy = "segments")
    private Set<User> users = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id")
    private Plant plant;

    public Long getId() {
        return idSegment;
    }

    public void setId(Long id) {
        this.idSegment = id;
    }
}