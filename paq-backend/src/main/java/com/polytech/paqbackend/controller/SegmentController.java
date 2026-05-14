package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.SegmentDTO;
import com.polytech.paqbackend.service.SegmentService;
import org.springframework.http.HttpStatus;
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
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SegmentDTO>> getAllSegments() {
        List<SegmentDTO> segments = segmentService.getAllSegments();
        return ResponseEntity.ok(segments);
    }



    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SegmentDTO> getSegmentById(@PathVariable Long id) {
        return ResponseEntity.ok(segmentService.getSegmentById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SegmentDTO> create(@RequestBody SegmentDTO segmentDTO) {
        SegmentDTO created = segmentService.createSegment(segmentDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SegmentDTO> update(@PathVariable Long id, @RequestBody SegmentDTO segmentDTO) {
        return ResponseEntity.ok(segmentService.updateSegment(id, segmentDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        segmentService.deleteSegment(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/site/{siteId}/plant/{plantId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SegmentDTO>> getSegmentsBySiteAndPlant(
            @PathVariable Long siteId,
            @PathVariable Long plantId) {
        List<SegmentDTO> segments = segmentService.getSegmentsBySiteAndPlant(siteId, plantId);
        return ResponseEntity.ok(segments);
    }

    @GetMapping("/plant/{plantId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SegmentDTO>> getSegmentsByPlant(@PathVariable Long plantId) {
        List<SegmentDTO> segments = segmentService.getSegmentsByPlant(plantId);
        return ResponseEntity.ok(segments);
    }
}