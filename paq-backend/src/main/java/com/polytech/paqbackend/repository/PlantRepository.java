package com.polytech.paqbackend.repository;

import com.polytech.paqbackend.entity.Plant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlantRepository extends JpaRepository<Plant, Long> {

    List<Plant> findBySite_Id(Long siteId);


}


