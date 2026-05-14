package com.polytech.paqbackend.repository;


import com.polytech.paqbackend.entity.EntretienPositif;
import com.polytech.paqbackend.entity.Role;
import com.polytech.paqbackend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository

public interface EntretienPositifRepository extends JpaRepository<EntretienPositif, Long> {

}


