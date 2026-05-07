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

    // ✅ PUBLIC — utilisé AVANT la connexion (page PlantSelection)
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

    // 🔒 ADMIN seulement
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PlantDTO> createPlant(@RequestBody PlantDTO plantDTO) {
        Plant savedPlant = plantService.createFromDTO(plantDTO);
        return ResponseEntity.ok(toDTO(savedPlant));
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
        return ResponseEntity.ok(toDTO(updatedPlant));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePlant(@PathVariable Long id) {
        plantService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private PlantDTO toDTO(Plant plant) {
        return new PlantDTO(
                plant.getId(),
                plant.getName(),
                plant.getSite() != null ? plant.getSite().getId() : null,
                plant.getSite() != null ? plant.getSite().getName() : null
        );
    }
}