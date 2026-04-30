// SegmentService.java
package com.polytech.paqbackend.service;

import com.polytech.paqbackend.dto.SegmentDTO;
import com.polytech.paqbackend.entity.Segment;
import com.polytech.paqbackend.repository.SegmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SegmentService {

    private final SegmentRepository segmentRepository;

    public List<SegmentDTO> getAllSegments() {
        return segmentRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public SegmentDTO getSegmentById(Long id) {
        Segment segment = segmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Segment non trouvé: " + id));
        return toDTO(segment);
    }

    @Transactional
    public SegmentDTO createSegment(SegmentDTO segmentDTO) {
        if (segmentRepository.findByNomSegment(segmentDTO.getNomSegment()).isPresent()) {
            throw new RuntimeException("Un segment avec ce nom existe déjà");
        }

        Segment segment = Segment.builder()
                .nomSegment(segmentDTO.getNomSegment())
                .build();

        return toDTO(segmentRepository.save(segment));
    }

    @Transactional
    public SegmentDTO updateSegment(Long id, SegmentDTO segmentDTO) {
        Segment segment = segmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Segment non trouvé: " + id));

        segment.setNomSegment(segmentDTO.getNomSegment());

        return toDTO(segmentRepository.save(segment));
    }

    @Transactional
    public void deleteSegment(Long id) {
        if (!segmentRepository.existsById(id)) {
            throw new RuntimeException("Segment non trouvé: " + id);
        }
        segmentRepository.deleteById(id);
    }

    private SegmentDTO toDTO(Segment segment) {
        return SegmentDTO.builder()
                .id(segment.getId())
                .nomSegment(segment.getNomSegment())
                .build();
    }
}