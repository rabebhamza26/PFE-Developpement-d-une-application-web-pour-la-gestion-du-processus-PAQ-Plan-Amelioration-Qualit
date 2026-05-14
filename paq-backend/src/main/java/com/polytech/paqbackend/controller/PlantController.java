package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.PlantDTO;
import com.polytech.paqbackend.entity.Plant;
import com.polytech.paqbackend.entity.Site;
import com.polytech.paqbackend.service.PlantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/plants")
public class PlantController {

    private final PlantService plantService;

    @Autowired
    public PlantController(PlantService plantService) {
        this.plantService = plantService;
    }

    @GetMapping
    public ResponseEntity<List<PlantDTO>> getAllPlants() {
        List<PlantDTO> plants = plantService.getAll()
                .stream()
                .map(plantService::toDTOWithSegments)
                .collect(Collectors.toList());
        return ResponseEntity.ok(plants);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlantDTO> getPlantById(@PathVariable Long id) {
        Plant plant = plantService.getById(id);
        return ResponseEntity.ok(plantService.toDTOWithSegments(plant));
    }

    @GetMapping("/site/{siteId}")
    public ResponseEntity<List<PlantDTO>> getPlantsBySite(@PathVariable Long siteId) {
        List<PlantDTO> plants = plantService.getBySite(siteId)
                .stream()
                .map(plantService::toDTOWithSegments)
                .collect(Collectors.toList());
        return ResponseEntity.ok(plants);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlantDTO> createPlant(@RequestBody PlantDTO plantDTO) {
        Plant savedPlant = plantService.createFromDTO(plantDTO);
        return ResponseEntity.ok(plantService.toDTOWithSegments(savedPlant));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlantDTO> updatePlant(@PathVariable Long id, @RequestBody PlantDTO plantDTO) {
        Plant plant = new Plant();
        plant.setName(plantDTO.getName());
        if (plantDTO.getSiteId() != null) {
            Site site = new Site();
            site.setId(plantDTO.getSiteId());
            plant.setSite(site);
        }
        Plant updatedPlant = plantService.update(id, plant);
        return ResponseEntity.ok(plantService.toDTOWithSegments(updatedPlant));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePlant(@PathVariable Long id) {
        plantService.delete(id);
        return ResponseEntity.noContent().build();
    }
}