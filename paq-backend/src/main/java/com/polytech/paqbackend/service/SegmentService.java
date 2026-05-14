package com.polytech.paqbackend.service;

import com.polytech.paqbackend.dto.SegmentDTO;
import com.polytech.paqbackend.entity.Plant;
import com.polytech.paqbackend.entity.Segment;
import com.polytech.paqbackend.repository.PlantRepository;
import com.polytech.paqbackend.repository.SegmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SegmentService {

    private final SegmentRepository segmentRepository;
    private final PlantRepository plantRepository;

    @Autowired
    public SegmentService(SegmentRepository segmentRepository, PlantRepository plantRepository) {
        this.segmentRepository = segmentRepository;
        this.plantRepository = plantRepository;
    }

    @Transactional(readOnly = true)
    public List<SegmentDTO> getAllSegments() {
        return segmentRepository.findAllOrderedByName()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SegmentDTO> getSegmentsByPlant(Long plantId) {
        return segmentRepository.findByPlantId(plantId)
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
        // Vérifier que le plant existe
        Plant plant = plantRepository.findById(segmentDTO.getPlantId())
                .orElseThrow(() -> new RuntimeException("Plant non trouvé avec l'id: " + segmentDTO.getPlantId()));

        // Vérifier si un segment avec le même nom existe déjà dans le même plant
        if (segmentRepository.findByNomSegmentAndPlantId(segmentDTO.getNomSegment(), segmentDTO.getPlantId()).isPresent()) {
            throw new RuntimeException("Un segment avec le nom '" + segmentDTO.getNomSegment() + "' existe déjà dans ce plant");
        }

        Segment segment = Segment.builder()
                .nomSegment(segmentDTO.getNomSegment())
                .plant(plant)
                .build();

        Segment savedSegment = segmentRepository.save(segment);
        return convertToDTO(savedSegment);
    }

    @Transactional
    public SegmentDTO updateSegment(Long id, SegmentDTO segmentDTO) {
        Segment segment = segmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Segment non trouvé avec l'id: " + id));

        // Vérifier que le plant existe
        Plant plant = plantRepository.findById(segmentDTO.getPlantId())
                .orElseThrow(() -> new RuntimeException("Plant non trouvé avec l'id: " + segmentDTO.getPlantId()));

        // Vérifier si le nouveau nom n'existe pas déjà dans le même plant (en excluant le segment actuel)
        boolean duplicateExists = segmentRepository.existsDuplicateForUpdate(
                segmentDTO.getNomSegment(),
                segmentDTO.getPlantId(),
                id
        );

        if (duplicateExists) {
            throw new RuntimeException("Un segment avec le nom '" + segmentDTO.getNomSegment() + "' existe déjà dans ce plant");
        }

        segment.setNomSegment(segmentDTO.getNomSegment());
        segment.setPlant(plant);

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

    // Méthode de conversion principale
    private SegmentDTO convertToDTO(Segment segment) {
        SegmentDTO.SegmentDTOBuilder builder = SegmentDTO.builder()
                .id(segment.getIdSegment())
                .nomSegment(segment.getNomSegment());

        if (segment.getPlant() != null) {
            builder.plantId(segment.getPlant().getId())
                    .plantName(segment.getPlant().getName());
            if (segment.getPlant().getSite() != null) {
                builder.siteId(segment.getPlant().getSite().getId())
                        .siteName(segment.getPlant().getSite().getName());
            }
        }

        return builder.build();
    }

    // Méthode alias pour cohérence (appelle convertToDTO)
    private SegmentDTO toDTO(Segment segment) {
        return convertToDTO(segment);
    }

    @Transactional(readOnly = true)
    public List<SegmentDTO> getSegmentsBySiteAndPlant(Long siteId, Long plantId) {
        List<Segment> segments = segmentRepository.findBySiteAndPlant(siteId, plantId);
        return segments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

}