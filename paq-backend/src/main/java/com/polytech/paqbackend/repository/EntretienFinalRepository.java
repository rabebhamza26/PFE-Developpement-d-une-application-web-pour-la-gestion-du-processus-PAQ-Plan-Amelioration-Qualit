package com.polytech.paqbackend.repository;

import com.polytech.paqbackend.entity.EntretienFinal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EntretienFinalRepository extends JpaRepository<EntretienFinal, Long> {

    /**
     * Récupère tous les entretiens finaux d'un collaborateur, triés par date.
     */
    List<EntretienFinal> findByMatriculeOrderByDateEntretienDesc(String matricule);

    /**
     * Alias simple utilisé dans EntretienFinalService.
     */
    default List<EntretienFinal> findByMatricule(String matricule) {
        return findByMatriculeOrderByDateEntretienDesc(matricule);
    }
}