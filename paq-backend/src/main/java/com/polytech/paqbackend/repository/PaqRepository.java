package com.polytech.paqbackend.repository;


import com.polytech.paqbackend.entity.PaqDossier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PaqRepository extends JpaRepository<PaqDossier, String > {

    Optional<PaqDossier> findByCollaboratorMatricule(String  matricule);
    long countByCreatedAtAfter(LocalDateTime date);
}