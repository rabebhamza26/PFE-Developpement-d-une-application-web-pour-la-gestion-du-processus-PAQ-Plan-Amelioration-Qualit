package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.EntretienMesureRequestDTO;
import com.polytech.paqbackend.entity.EntretienMesure;
import com.polytech.paqbackend.service.EntretienMesureService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/entretiens-mesures")
public class EntretienMesureController {

    private final EntretienMesureService service;

    public EntretienMesureController(EntretienMesureService service) {
        this.service = service;
    }

    @PostMapping("/{matricule}")
    public ResponseEntity<EntretienMesure> create(
            @PathVariable String matricule,
            @RequestBody EntretienMesureRequestDTO dto,
            Authentication authentication) {

        String expediteurEmail = authentication.getName();
        EntretienMesure saved = service.create(matricule, dto, expediteurEmail);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public EntretienMesure update(@PathVariable Long id, @RequestBody EntretienMesureRequestDTO dto) {
        return service.update(id, dto);
    }

    @GetMapping("/{matricule}")
    public List<EntretienMesure> get(@PathVariable String matricule) {
        return service.getByMatricule(matricule);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}