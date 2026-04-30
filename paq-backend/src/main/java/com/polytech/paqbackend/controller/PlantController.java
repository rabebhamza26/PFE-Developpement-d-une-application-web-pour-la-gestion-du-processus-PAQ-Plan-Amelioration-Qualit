package com.polytech.paqbackend.controller;


import com.polytech.paqbackend.dto.PlantDTO;
import com.polytech.paqbackend.entity.Plant;
import com.polytech.paqbackend.service.PlantService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/plants")
public class PlantController {

    private final PlantService plantService;

    public PlantController(PlantService plantService) {
        this.plantService = plantService;
    }

    private PlantDTO toDTO(Plant plant) {
        return new PlantDTO(
                plant.getId(),
                plant.getName(),
                plant.getSite() != null ? plant.getSite().getId() : null,
                plant.getSite() != null ? plant.getSite().getName() : null
        );
    }

    @GetMapping
    public ResponseEntity<List<PlantDTO>> getAllPlants() {
        List<PlantDTO> plants = plantService.getAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(plants);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlantDTO> getPlantById(@PathVariable Long id) {
        Plant plant = plantService.getById(id);
        return ResponseEntity.ok(toDTO(plant));
    }

    @GetMapping("/site/{siteId}")
    public ResponseEntity<List<PlantDTO>> getPlantsBySite(@PathVariable Long siteId) {
        List<PlantDTO> plants = plantService.getBySite(siteId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(plants);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Plant> createPlant(@RequestBody Plant plant) {
        return ResponseEntity.ok(plantService.save(plant));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Plant> updatePlant(@PathVariable Long id, @RequestBody Plant plant) {
        return ResponseEntity.ok(plantService.update(id, plant));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePlant(@PathVariable Long id) {
        plantService.delete(id);
        return ResponseEntity.noContent().build();
    }
}