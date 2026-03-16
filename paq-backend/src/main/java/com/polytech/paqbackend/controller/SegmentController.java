package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.entity.Segment;
import com.polytech.paqbackend.repository.SegmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/segments")
@CrossOrigin(origins = "http://localhost:5177")
public class SegmentController {
    @Autowired
    private SegmentRepository segmentRepository;

    // GET all
    @GetMapping
    public List<Segment> getAllSegments() {
        return segmentRepository.findAll();
    }

    // GET by id
    @GetMapping("/{id}")
    public ResponseEntity<Segment> getSegmentById(@PathVariable Long id) {
        return segmentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // CREATE
    @PostMapping
    public Segment createSegment(@RequestBody Segment segment) {
        return segmentRepository.save(segment);
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Segment> updateSegment(@PathVariable Long id, @RequestBody Segment segmentDetails) {
        return segmentRepository.findById(id).map(segment -> {
            segment.setNomSegment(segmentDetails.getNomSegment());
            segmentRepository.save(segment);
            return ResponseEntity.ok(segment);
        }).orElse(ResponseEntity.notFound().build());
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSegment(@PathVariable Long id) {
        return segmentRepository.findById(id).map(segment -> {
            segmentRepository.delete(segment);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}