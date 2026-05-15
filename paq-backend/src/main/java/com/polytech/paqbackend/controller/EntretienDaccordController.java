package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.EntretienDaccordRequestDTO;
import com.polytech.paqbackend.entity.EntretienDaccord;
import com.polytech.paqbackend.service.EntretienDaccordService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/entretiens-daccord")
public class EntretienDaccordController {

    private final EntretienDaccordService service;

    public EntretienDaccordController(EntretienDaccordService service) {
        this.service = service;
    }

    @PostMapping("/{matricule}")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<?> create(@PathVariable String matricule, @RequestBody EntretienDaccordRequestDTO dto, Authentication authentication) {
        return ResponseEntity.ok(service.createAvecNotification(matricule, dto, authentication.getName()));
    }

    @PutMapping("/{matricule}/{id}")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<EntretienDaccord> update(@PathVariable String matricule, @PathVariable Long id, @RequestBody EntretienDaccordRequestDTO dto, Authentication authentication) {
        return ResponseEntity.ok(service.updateAvecNotification(id, matricule, dto, authentication.getName()));
    }

    //  SL soumet pour validation (envoi email au QM_SEGMENT)
    @PostMapping("/{matricule}/{id}/valider-premiere")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<?> validerPremiere(@PathVariable String matricule, @PathVariable Long id, @RequestBody EntretienDaccordRequestDTO dto, Authentication authentication) {
        return ResponseEntity.ok(service.validerPremiere(id, matricule, dto, authentication.getName()));
    }

    //  QM_SEGMENT valide finalement
    @PostMapping("/{matricule}/{id}/valider")
    @PreAuthorize("hasRole('QM_SEGMENT')")
    public ResponseEntity<?> valider(@PathVariable String matricule, @PathVariable Long id, @RequestBody EntretienDaccordRequestDTO dto, Authentication authentication) {
        return ResponseEntity.ok(service.validerFinale(id, matricule, dto, authentication.getName()));
    }



    @GetMapping("/matricule/{matricule}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<EntretienDaccord>> getByMatricule(@PathVariable String matricule) {
        return ResponseEntity.ok(service.findByMatricule(matricule));
    }
}