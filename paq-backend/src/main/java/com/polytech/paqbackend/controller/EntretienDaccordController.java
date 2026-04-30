package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.EntretienDaccordRequestDTO;
import com.polytech.paqbackend.entity.EntretienDaccord;
import com.polytech.paqbackend.service.EntretienDaccordService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/entretiens-daccord")
public class EntretienDaccordController {

    private final EntretienDaccordService service;

    public EntretienDaccordController(EntretienDaccordService service) {
        this.service = service;
    }

    @PostMapping("/{matricule}")
    public ResponseEntity<?> create(
            @PathVariable String matricule,
            @RequestBody EntretienDaccordRequestDTO dto,
            Authentication authentication) {

        String expediteurEmail = authentication.getName();
        EntretienDaccord saved = service.create(matricule, dto, expediteurEmail);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{matricule}/{id}")
    public ResponseEntity<EntretienDaccord> update(
            @PathVariable String matricule,
            @PathVariable Long id,
            @RequestBody EntretienDaccordRequestDTO dto) {
        EntretienDaccord exist = service.findById(id);
        return ResponseEntity.ok(service.update(exist, dto));
    }

    @GetMapping("/matricule/{matricule}")
    public ResponseEntity<List<EntretienDaccord>> getByMatricule(@PathVariable String matricule) {
        return ResponseEntity.ok(service.findByMatricule(matricule));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EntretienDaccord> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}