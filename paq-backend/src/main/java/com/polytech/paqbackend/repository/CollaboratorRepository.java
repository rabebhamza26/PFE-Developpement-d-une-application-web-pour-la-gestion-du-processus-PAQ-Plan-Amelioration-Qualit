package com.polytech.paqbackend.repository;

import com.polytech.paqbackend.entity.Collaborator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CollaboratorRepository extends JpaRepository<Collaborator, String > {
    boolean existsByMatricule(String  matricule);
    Optional<Collaborator> findByMatricule(String  matricule);

    long countByActifTrue();


}