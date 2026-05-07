package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.EntretienFinalDTO;
import com.polytech.paqbackend.entity.EntretienFinal;
import com.polytech.paqbackend.service.EntretienFinalService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Entretien Final (niveau 5)
 *
 * Règles métier :
 *  - RH : Créer / Modifier / Supprimer / Valider / Consulter
 *  - Tous les autres rôles : Consulter uniquement
 */
@RestController
@RequestMapping("/api/entretien-final")
public class EntretienFinalController {

    private final EntretienFinalService entretienFinalService;

    public EntretienFinalController(EntretienFinalService entretienFinalService) {
        this.entretienFinalService = entretienFinalService;
    }

    @PostMapping("/{matricule}")
    @PreAuthorize("hasAuthority('final:create')")
    public ResponseEntity<?> createEntretienFinal(
            @PathVariable String matricule,
            @RequestBody EntretienFinalDTO dto,
            Authentication authentication) {
        try {
            String expediteurEmail = authentication.getName();
            EntretienFinal saved = entretienFinalService.createAvecNotification(matricule, dto, expediteurEmail);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{matricule}/{id}")
    @PreAuthorize("hasAuthority('final:update')")
    public ResponseEntity<?> updateEntretienFinal(
            @PathVariable String matricule,
            @PathVariable Long id,
            @RequestBody EntretienFinalDTO dto,
            Authentication authentication) {
        try {
            String expediteurEmail = authentication.getName();
            EntretienFinal updated = entretienFinalService.updateAvecNotification(id, matricule, dto, expediteurEmail);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{matricule}")
    @PreAuthorize("hasAuthority('final:read')")
    public ResponseEntity<?> getByMatricule(@PathVariable String matricule) {
        try {
            return ResponseEntity.ok(entretienFinalService.getByMatricule(matricule));
        } catch (Exception e) {
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @DeleteMapping("/{matricule}/{id}")
    @PreAuthorize("hasAuthority('final:delete')")
    public ResponseEntity<?> delete(
            @PathVariable String matricule,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {
        try {
            String expediteurEmail   = authentication.getName();
            String destinataireEmail = body != null ? body.get("destinataireEmail") : null;
            String nomCollab         = body != null ? body.get("nomCollab") : matricule;

            entretienFinalService.deleteAvecNotification(id, matricule, expediteurEmail, destinataireEmail, nomCollab);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** Valider — RH uniquement */
    @PostMapping("/{matricule}/{id}/valider")
    @PreAuthorize("hasAuthority('final:validate')")
    public ResponseEntity<?> valider(
            @PathVariable String matricule,
            @PathVariable Long id,
            @RequestBody EntretienFinalDTO dto,
            Authentication authentication) {
        try {
            String expediteurEmail = authentication.getName();
            EntretienFinal updated = entretienFinalService.updateAvecNotification(id, matricule, dto, expediteurEmail);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}