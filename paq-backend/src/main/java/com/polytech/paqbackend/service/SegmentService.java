package com.polytech.paqbackend.service;

import com.polytech.paqbackend.dto.SegmentDTO;
import com.polytech.paqbackend.entity.Segment;
import com.polytech.paqbackend.repository.SegmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SegmentService {

    private final SegmentRepository segmentRepository;

    @Autowired
    public SegmentService(SegmentRepository segmentRepository) {
        this.segmentRepository = segmentRepository;
    }

    @Transactional(readOnly = true)
    public List<SegmentDTO> getAllSegments() {
        return segmentRepository.findAllOrderedByName()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SegmentDTO getSegmentById(Long id) {
        Segment segment = segmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Segment non trouvé avec l'id: " + id));
        return convertToDTO(segment);
    }

    @Transactional
    public SegmentDTO createSegment(SegmentDTO segmentDTO) {
        // Vérifier si un segment avec le même nom existe déjà
        if (segmentRepository.findByNomSegment(segmentDTO.getNomSegment()).isPresent()) {
            throw new RuntimeException("Un segment avec ce nom existe déjà");
        }

        Segment segment = Segment.builder()
                .nomSegment(segmentDTO.getNomSegment())
                .build();

        Segment savedSegment = segmentRepository.save(segment);
        return convertToDTO(savedSegment);
    }

    @Transactional
    public SegmentDTO updateSegment(Long id, SegmentDTO segmentDTO) {
        Segment segment = segmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Segment non trouvé avec l'id: " + id));

        // Vérifier si le nouveau nom n'existe pas déjà (sauf pour le même segment)
        if (!segment.getNomSegment().equals(segmentDTO.getNomSegment())) {
            if (segmentRepository.findByNomSegment(segmentDTO.getNomSegment()).isPresent()) {
                throw new RuntimeException("Un segment avec ce nom existe déjà");
            }
        }

        segment.setNomSegment(segmentDTO.getNomSegment());
        Segment updatedSegment = segmentRepository.save(segment);
        return convertToDTO(updatedSegment);
    }

    @Transactional
    public void deleteSegment(Long id) {
        if (!segmentRepository.existsById(id)) {
            throw new RuntimeException("Segment non trouvé avec l'id: " + id);
        }
        segmentRepository.deleteById(id);
    }

    private SegmentDTO convertToDTO(Segment segment) {
        return SegmentDTO.builder()
                .id(segment.getIdSegment())
                .nomSegment(segment.getNomSegment())
                .build();
    }
}