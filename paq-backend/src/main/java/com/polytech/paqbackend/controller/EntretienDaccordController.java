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

/**
 * Entretien d'Accord (niveau 2)
 *
 * Règles métier :
 *  - SL : Créer / Modifier / Supprimer / Valider
 *  - QM_SEGMENT : Valider
 *  - Tous : Consulter
 */
@RestController
@RequestMapping("/api/entretiens-daccord")
public class EntretienDaccordController {

    private final EntretienDaccordService service;

    public EntretienDaccordController(EntretienDaccordService service) {
        this.service = service;
    }

    @PostMapping("/{matricule}")
    @PreAuthorize("hasAuthority('accord:create')")
    public ResponseEntity<?> create(
            @PathVariable String matricule,
            @RequestBody EntretienDaccordRequestDTO dto,
            Authentication authentication) {

        String expediteurEmail = authentication.getName();
        EntretienDaccord saved = service.createAvecNotification(matricule, dto, expediteurEmail);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{matricule}/{id}")
    @PreAuthorize("hasAuthority('accord:update')")
    public ResponseEntity<EntretienDaccord> update(
            @PathVariable String matricule,
            @PathVariable Long id,
            @RequestBody EntretienDaccordRequestDTO dto,
            Authentication authentication) {

        String expediteurEmail = authentication.getName();
        EntretienDaccord updated = service.updateAvecNotification(id, matricule, dto, expediteurEmail);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{matricule}/{id}")
    @PreAuthorize("hasAuthority('accord:delete')")
    public ResponseEntity<Void> delete(
            @PathVariable String matricule,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {

        String expediteurEmail   = authentication.getName();
        String destinataireEmail = body != null ? body.get("destinataireEmail") : null;
        String nomCollab         = body != null ? body.get("nomCollab") : matricule;

        service.deleteAvecNotification(id, matricule, expediteurEmail, destinataireEmail, nomCollab);
        return ResponseEntity.noContent().build();
    }

    /** Valider — accessible à SL (accord:validate) et QM_SEGMENT (accord:validate) */
    @PostMapping("/{matricule}/{id}/valider")
    @PreAuthorize("hasAuthority('accord:validate')")
    public ResponseEntity<?> valider(
            @PathVariable String matricule,
            @PathVariable Long id,
            @RequestBody EntretienDaccordRequestDTO dto,
            Authentication authentication) {

        String expediteurEmail = authentication.getName();
        // La validation est traitée comme une mise à jour avec flag "validé"
        dto.setValidationMesures("Oui");
        EntretienDaccord updated = service.updateAvecNotification(id, matricule, dto, expediteurEmail);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/matricule/{matricule}")
    @PreAuthorize("hasAuthority('accord:read')")
    public ResponseEntity<List<EntretienDaccord>> getByMatricule(@PathVariable String matricule) {
        return ResponseEntity.ok(service.findByMatricule(matricule));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('accord:read')")
    public ResponseEntity<EntretienDaccord> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }
}