package com.polytech.paqbackend.repository;

import com.polytech.paqbackend.entity.PremierEntretien;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PremierEntretienRepository extends JpaRepository<PremierEntretien, Long> {
    List<PremierEntretien> findByMatricule(String matricule);
}