// SegmentController.java - Version mise à jour
package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.SegmentDTO;
import com.polytech.paqbackend.service.SegmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/segments")
public class SegmentController {

    private final SegmentService segmentService;

    public SegmentController(SegmentService segmentService) {
        this.segmentService = segmentService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SegmentDTO>> getAllSegments() {
        return ResponseEntity.ok(segmentService.getAllSegments());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SegmentDTO> getSegmentById(@PathVariable Long id) {
        return ResponseEntity.ok(segmentService.getSegmentById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SegmentDTO> createSegment(@RequestBody SegmentDTO segmentDTO) {
        return ResponseEntity.ok(segmentService.createSegment(segmentDTO));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SegmentDTO> updateSegment(@PathVariable Long id, @RequestBody SegmentDTO segmentDTO) {
        return ResponseEntity.ok(segmentService.updateSegment(id, segmentDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSegment(@PathVariable Long id) {
        segmentService.deleteSegment(id);
        return ResponseEntity.noContent().build();
    }
}