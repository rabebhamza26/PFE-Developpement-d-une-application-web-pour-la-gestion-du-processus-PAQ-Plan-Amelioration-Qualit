package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.EntretienExplicatifDTO;
import com.polytech.paqbackend.entity.EntretienExplicatif;
import com.polytech.paqbackend.service.EntretienExplicatifService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/entretiens")
public class EntretienExplicatifController {

    private final EntretienExplicatifService service;

    public EntretienExplicatifController(EntretienExplicatifService service) {
        this.service = service;
    }

    /**
     * SEUL SL peut créer un entretien explicatif
     */
    @PostMapping("/{matricule}")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<EntretienExplicatif> create(
            @PathVariable String matricule,
            @RequestBody EntretienExplicatifDTO dto,
            Authentication authentication) {
        return ResponseEntity.ok(service.createAvecNotification(matricule, dto, 1, authentication.getName()));
    }

    /**
     * SEUL SL peut modifier un entretien explicatif
     */
    @PutMapping("/{matricule}/{id}")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<EntretienExplicatif> update(
            @PathVariable String matricule, @PathVariable Long id,
            @RequestBody EntretienExplicatifDTO dto, Authentication authentication) {
        return ResponseEntity.ok(service.updateAvecNotification(id, matricule, dto, 1, authentication.getName()));
    }

    /**
     * SEUL SL peut supprimer un entretien explicatif
     */
    @DeleteMapping("/{matricule}/{id}")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<Void> delete(
            @PathVariable String matricule, @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body, Authentication authentication) {
        String destinataireEmail = body != null ? body.get("destinataireEmail") : null;
        String nomCollab = body != null ? body.get("nomCollab") : matricule;
        service.deleteAvecNotification(id, matricule, authentication.getName(), destinataireEmail, nomCollab);
        return ResponseEntity.noContent().build();
    }

    /**
     * Validation d'un entretien explicatif - SEUL SL
     */
    @PostMapping("/{id}/validate")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<Void> validate(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        service.validate(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

    /**
     * Lecture accessible à tous les utilisateurs authentifiés
     */
    @GetMapping("/matricule/{matricule}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<EntretienExplicatif>> getByMatricule(@PathVariable String matricule) {
        return ResponseEntity.ok(service.findByMatricule(matricule));
    }
}