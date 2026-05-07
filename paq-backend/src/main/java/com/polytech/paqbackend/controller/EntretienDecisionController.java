package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.EntretienDecisionRequestDTO;
import com.polytech.paqbackend.entity.EntretienDecision;
import com.polytech.paqbackend.service.EntretienDecisionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Entretien de Décision (niveau 4)
 *
 * Règles métier :
 *  - SL           : Créer / Modifier / Supprimer
 *  - HP / SGL     : Valider (1re validation)
 *  - QM_PLANT     : Valider (2e validation)
 *  - Tous         : Consulter
 */
@RestController
@RequestMapping("/api/entretiens-decision")
public class EntretienDecisionController {

    private final EntretienDecisionService service;

    public EntretienDecisionController(EntretienDecisionService service) {
        this.service = service;
    }

    @PostMapping("/{matricule}")
    @PreAuthorize("hasAuthority('decision:create')")
    public ResponseEntity<?> create(
            @PathVariable String matricule,
            @RequestBody EntretienDecisionRequestDTO dto,
            Authentication authentication) {
        try {
            String expediteurEmail = authentication.getName();
            EntretienDecision saved = service.createAvecNotification(matricule, dto, expediteurEmail);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PutMapping("/{matricule}/{id}")
    @PreAuthorize("hasAuthority('decision:update')")
    public ResponseEntity<?> update(
            @PathVariable String matricule,
            @PathVariable Long id,
            @RequestBody EntretienDecisionRequestDTO dto,
            Authentication authentication) {
        try {
            String expediteurEmail = authentication.getName();
            EntretienDecision updated = service.updateAvecNotification(id, matricule, dto, expediteurEmail);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @DeleteMapping("/{matricule}/{id}")
    @PreAuthorize("hasAuthority('decision:delete')")
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

    /** 1re validation — HP ou SGL */
    @PostMapping("/{matricule}/{id}/valider1")
    @PreAuthorize("hasAuthority('decision:validate1')")
    public ResponseEntity<?> valider1(
            @PathVariable String matricule,
            @PathVariable Long id,
            @RequestBody EntretienDecisionRequestDTO dto,
            Authentication authentication) {
        try {
            String expediteurEmail = authentication.getName();
            EntretienDecision updated = service.updateAvecNotification(id, matricule, dto, expediteurEmail);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    /** 2e validation — QM_PLANT */
    @PostMapping("/{matricule}/{id}/valider2")
    @PreAuthorize("hasAuthority('decision:validate2')")
    public ResponseEntity<?> valider2(
            @PathVariable String matricule,
            @PathVariable Long id,
            @RequestBody EntretienDecisionRequestDTO dto,
            Authentication authentication) {
        try {
            String expediteurEmail = authentication.getName();
            EntretienDecision updated = service.updateAvecNotification(id, matricule, dto, expediteurEmail);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @GetMapping("/matricule/{matricule}")
    @PreAuthorize("hasAuthority('decision:read')")
    public ResponseEntity<List<EntretienDecision>> getByMatricule(@PathVariable String matricule) {
        return ResponseEntity.ok(service.findByMatricule(matricule));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('decision:read')")
    public ResponseEntity<EntretienDecision> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }
}