package com.polytech.paqbackend.repository;

import com.polytech.paqbackend.entity.EntretienMesure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
@Repository

public interface EntretienMesureRepository  extends JpaRepository<EntretienMesure, Long> {
    List<EntretienMesure> findByMatricule(String matricule);
    List<EntretienMesure> findByDateRequalificationBeforeAndAlerteEnvoyeeFalse(LocalDate date);
}