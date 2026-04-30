package com.polytech.paqbackend.repository;


import com.polytech.paqbackend.entity.EntretienPositif;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository

public interface EntretienPositifRepository extends JpaRepository<EntretienPositif, Long> {
}


