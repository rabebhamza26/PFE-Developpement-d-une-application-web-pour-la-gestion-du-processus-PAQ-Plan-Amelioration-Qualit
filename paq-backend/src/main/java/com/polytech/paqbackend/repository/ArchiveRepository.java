package com.polytech.paqbackend.repository;

import com.polytech.paqbackend.entity.Archive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArchiveRepository extends JpaRepository<Archive, Long> {
    List<Archive> findByType(String type);
    List<Archive> findByMatriculeContainingIgnoreCase(String matricule);
    boolean existsByPaqDossierId(Long paqDossierId);



    Optional<Archive> findTopByMatriculeOrderByDateArchivageDesc(String matricule);
    List<Archive> findByMatricule(String matricule);

}