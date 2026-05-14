package com.polytech.paqbackend.repository;

import com.polytech.paqbackend.entity.Segment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SegmentRepository extends JpaRepository<Segment, Long> {



    Optional<Segment> findByNomSegment(String nomSegment);

    Optional<Segment> findByNomSegmentAndPlantId(String nomSegment, Long plantId);

    List<Segment> findByPlantId(Long plantId);

    @Query("SELECT s FROM Segment s ORDER BY s.nomSegment")
    List<Segment> findAllOrderedByName();

    @Query("SELECT COUNT(s) > 0 FROM Segment s WHERE s.nomSegment = :nomSegment AND s.plant.id = :plantId AND s.idSegment != :excludeId")
    boolean existsDuplicateForUpdate(@Param("nomSegment") String nomSegment, @Param("plantId") Long plantId, @Param("excludeId") Long excludeId);

    // Correction: accéder au site via plant.site
    @Query("SELECT s FROM Segment s WHERE s.plant.site.id = :siteId AND s.plant.id = :plantId")
    List<Segment> findBySiteAndPlant(@Param("siteId") Long siteId, @Param("plantId") Long plantId);

}