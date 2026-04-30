package com.polytech.paqbackend.repository;

import com.polytech.paqbackend.entity.EntretienDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository

public interface EntretienDecisionRepository extends JpaRepository<EntretienDecision, Long> {

    List<EntretienDecision> findByMatricule(String matricule);
}