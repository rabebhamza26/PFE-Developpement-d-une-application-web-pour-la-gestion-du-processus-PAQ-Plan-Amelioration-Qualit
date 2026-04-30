package com.polytech.paqbackend.repository;

import com.polytech.paqbackend.entity.EntretienExplicatif;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository

public interface EntretienExplicatifRepository extends JpaRepository<EntretienExplicatif, Long> {
    List<EntretienExplicatif> findByMatricule(String matricule);
}
