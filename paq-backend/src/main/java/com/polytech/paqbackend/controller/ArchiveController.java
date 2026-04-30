package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.entity.Archive;
import com.polytech.paqbackend.repository.ArchiveRepository;
import com.polytech.paqbackend.service.ArchivingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/archives")

public class ArchiveController {

    @Autowired
    private ArchiveRepository repository;

    @Autowired
    private ArchivingService archivingService;

    /** GET /api/archives → toutes les archives */
    @GetMapping
    public List<Archive> getAll() {
        return repository.findAll();
    }

    /** GET /api/archives/type/{type} → filtrer par type */
    @GetMapping("/type/{type}")
    public List<Archive> getByType(@PathVariable String type) {
        return repository.findByType(type);
    }

    /** GET /api/archives/{id} → détail d'une archive par ID */
    @GetMapping("/{id}")
    public ResponseEntity<Archive> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/archives/search?matricule=xxx */
    @GetMapping("/search")
    public List<Archive> searchByMatricule(@RequestParam String matricule) {
        return repository.findByMatriculeContainingIgnoreCase(matricule);
    }

    /** GET /api/archives/matricule/{matricule} → archive exacte par matricule */
    @GetMapping("/matricule/{matricule}")
    public ResponseEntity<Archive> getByMatricule(@PathVariable String matricule) {
        List<Archive> results = repository.findByMatriculeContainingIgnoreCase(matricule);
        if (results.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        // Retourner la plus récente
        Archive latest = results.stream()
                .max(java.util.Comparator.comparing(
                        a -> a.getDateArchivage() != null ? a.getDateArchivage() : java.time.LocalDate.MIN
                ))
                .orElse(results.get(0));
        return ResponseEntity.ok(latest);
    }



    @GetMapping("/simulate")
    public String simulateArchive(@RequestParam String date) {
        LocalDate simulatedDate = LocalDate.parse(date);
        archivingService.setSimulatedToday(simulatedDate);
        archivingService.archiveExpiredPaqs();
        return "Simulation faite pour la date : " + date;
    }
}