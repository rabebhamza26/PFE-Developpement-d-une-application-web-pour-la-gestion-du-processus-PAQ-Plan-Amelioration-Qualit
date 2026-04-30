package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.EntretienDecisionRequestDTO;
import com.polytech.paqbackend.entity.EntretienDecision;
import com.polytech.paqbackend.service.EntretienDecisionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/entretiens-decision")
public class EntretienDecisionController {

    private final EntretienDecisionService service;

    public EntretienDecisionController(EntretienDecisionService service) {
        this.service = service;
    }

    @PostMapping("/{matricule}")
    public ResponseEntity<?> create(
            @PathVariable String matricule,
            @RequestBody EntretienDecisionRequestDTO dto,
            Authentication authentication) {
        try {
            String expediteurEmail = authentication.getName();
            EntretienDecision saved = service.create(matricule, dto, expediteurEmail);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @GetMapping("/matricule/{matricule}")
    public ResponseEntity<List<EntretienDecision>> getByMatricule(@PathVariable String matricule) {
        return ResponseEntity.ok(service.findByMatricule(matricule));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EntretienDecision> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PutMapping("/{matricule}/{id}")
    public ResponseEntity<?> update(
            @PathVariable String matricule,
            @PathVariable Long id,
            @RequestBody EntretienDecisionRequestDTO dto) {
        try {
            EntretienDecision existing = service.findById(id);
            return ResponseEntity.ok(service.update(existing, dto));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}