package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.EntretienFinalDTO;
import com.polytech.paqbackend.entity.EntretienFinal;
import com.polytech.paqbackend.service.EntretienFinalService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/entretien-final")
public class EntretienFinalController {

    private final EntretienFinalService entretienFinalService;

    public EntretienFinalController(EntretienFinalService entretienFinalService) {
        this.entretienFinalService = entretienFinalService;
    }

    @PostMapping("/{matricule}")
    public ResponseEntity<?> createEntretienFinal(
            @PathVariable String matricule,
            @RequestBody EntretienFinalDTO dto,
            Authentication authentication) {
        try {
            String expediteurEmail = authentication.getName();
            EntretienFinal saved = entretienFinalService.createEntretienFinal(matricule, dto, expediteurEmail);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{matricule}")
    public ResponseEntity<?> getByMatricule(@PathVariable String matricule) {
        try {
            return ResponseEntity.ok(entretienFinalService.getByMatricule(matricule));
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            entretienFinalService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}