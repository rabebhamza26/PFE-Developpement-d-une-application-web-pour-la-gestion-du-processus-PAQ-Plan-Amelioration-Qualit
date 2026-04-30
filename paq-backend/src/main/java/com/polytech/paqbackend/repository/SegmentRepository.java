package com.polytech.paqbackend.repository;

import com.polytech.paqbackend.entity.Segment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SegmentRepository extends JpaRepository<Segment, Long> {
    Optional<Segment> findByNomSegment(String nomSegment);

    @Query("SELECT s FROM Segment s ORDER BY s.nomSegment")
    List<Segment> findAllOrderedByName();
    }