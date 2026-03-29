package com.polytech.paqbackend.repository;

import com.polytech.paqbackend.dto.CollaborateurDTO;
import com.polytech.paqbackend.entity.Collaborator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CollaboratorRepository extends JpaRepository<Collaborator, String> {


    boolean existsByMatricule(String matricule);

    long countByActifTrue();

    Optional<Collaborator> findByMatricule(String matricule);

    @Query("SELECT c FROM Collaborator c WHERE c.actif = true AND c.depart = false")
    List<Collaborator> findAllActive();

    // Add missing methods for PaqSchedulerService
    @Query("SELECT c FROM Collaborator c WHERE c.depart = false AND c.archived = false")
    List<Collaborator> findByDepartFalseAndArchivedFalse();

    @Query("SELECT c FROM Collaborator c WHERE c.depart = true AND c.archived = false")
    List<Collaborator> findByDepartTrueAndArchivedFalse();

    /**
     * Récupère tous les collaborateurs avec leurs informations PAQ
     */
    @Query("""
        SELECT new com.polytech.paqbackend.dto.CollaborateurDTO(
            c.matricule,
            c.name,
            c.prenom,
            c.segment,
            c.hireDate,
            COALESCE(p.niveau, 0),
            p.derniereFaute,
            CASE 
                WHEN p.id IS NULL THEN 'POSITIF'
                WHEN p.statut = 'CLOTURE' THEN 'CLOTURE'
                WHEN p.statut = 'CRITIQUE' THEN 'CRITIQUE'
                ELSE CONCAT('NIVEAU ', p.niveau)
            END,
            CASE 
                WHEN p.id IS NULL 
                     AND c.hireDate <= :sixMonthsAgo 
                THEN true
                ELSE false
            END
        )
        FROM Collaborator c
        LEFT JOIN PaqDossier p ON c.matricule = p.collaboratorMatricule AND p.actif = true AND p.archived = false
        WHERE c.archived = false AND c.depart = false
        ORDER BY c.matricule
    """)
    List<CollaborateurDTO> getAllWithPaq(@Param("sixMonthsAgo") LocalDate sixMonthsAgo);

    /**
     * Récupère les collaborateurs sans faute (sans dossier PAQ ou avec niveau 0)
     */
    @Query("""
        SELECT new com.polytech.paqbackend.dto.CollaborateurDTO(
            c.matricule,
            c.name,
            c.prenom,
            c.segment,
            c.hireDate,
            COALESCE(p.niveau, 0),
            p.derniereFaute,
            CASE 
                WHEN p.id IS NULL THEN 'POSITIF'
                WHEN p.statut = 'CLOTURE' THEN 'CLOTURE'
                WHEN p.statut = 'CRITIQUE' THEN 'CRITIQUE'
                ELSE CONCAT('NIVEAU ', p.niveau)
            END,
            CASE 
                WHEN p.id IS NULL 
                     AND c.hireDate <= :sixMonthsAgo 
                THEN true
                ELSE false
            END
        )
        FROM Collaborator c
        LEFT JOIN PaqDossier p ON c.matricule = p.collaboratorMatricule AND p.actif = true AND p.archived = false
        WHERE c.archived = false 
          AND c.depart = false
          AND (p.id IS NULL OR p.niveau = 0)
        ORDER BY c.matricule
    """)
    List<CollaborateurDTO> findSansFaute(@Param("sixMonthsAgo") LocalDate sixMonthsAgo);

    /**
     * Méthode par défaut pour findSansFaute avec la date courante
     */
    default List<CollaborateurDTO> findSansFaute() {
        return findSansFaute(LocalDate.now().minusMonths(6));
    }

    /**
     * Méthode par défaut pour getAllWithPaq avec la date courante
     */
    default List<CollaborateurDTO> getAllWithPaq() {
        return getAllWithPaq(LocalDate.now().minusMonths(6));
    }

    /**
     * Compte les collaborateurs par segment
     */
    @Query("SELECT c.segment, COUNT(c) FROM Collaborator c WHERE c.archived = false AND c.depart = false GROUP BY c.segment")
    List<Object[]> countBySegment();

    /**
     * Récupère les collaborateurs par segment
     */
    @Query("SELECT c FROM Collaborator c WHERE c.segment = :segment AND c.archived = false AND c.depart = false")
    List<Collaborator> findBySegment(@Param("segment") String segment);

    /**
     * Récupère les collaborateurs avec un niveau spécifique
     */
    @Query("""
        SELECT c FROM Collaborator c 
        WHERE c.matricule IN (
            SELECT p.collaboratorMatricule FROM PaqDossier p 
            WHERE p.niveau = :niveau AND p.actif = true AND p.archived = false
        )
        AND c.archived = false AND c.depart = false
    """)
    List<Collaborator> findByPaqNiveau(@Param("niveau") int niveau);
}