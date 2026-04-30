package com.polytech.paqbackend.repository;


import com.polytech.paqbackend.entity.Faute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FauteRepository extends JpaRepository<Faute, Long> {
    Optional<Faute> findByNom(String nom);

    List<Faute> findByNomContainingIgnoreCase(String nom);
}