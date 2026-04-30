// Segment.java - Version avec relation Many-to-Many
package com.polytech.paqbackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "segments")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Segment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idSegment;

    @Column(nullable = false, unique = true)
    private String nomSegment;

    @ManyToMany(mappedBy = "segments")
    private Set<User> users = new HashSet<>();

    // Getter explicite pour l'ID
    public Long getId() {
        return idSegment;
    }

    public void setId(Long id) {
        this.idSegment = id;
    }
}