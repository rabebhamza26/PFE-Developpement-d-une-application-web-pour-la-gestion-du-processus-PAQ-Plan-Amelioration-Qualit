package com.polytech.paqbackend.repository;


import com.polytech.paqbackend.entity.EntretienDaccord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository

public interface EntretienDaccordRepository extends JpaRepository<EntretienDaccord, Long> {
    List<EntretienDaccord> findByMatricule(String matricule);
}
