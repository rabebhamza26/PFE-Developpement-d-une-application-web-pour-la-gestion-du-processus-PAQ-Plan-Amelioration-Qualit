package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.EntretienMesureRequestDTO;
import com.polytech.paqbackend.entity.EntretienMesure;
import com.polytech.paqbackend.service.EntretienMesureService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Entretien de Mesure (niveau 3)
 *
 * Règles métier :
 *  - SL      : Créer
 *  - SGL     : Modifier / Supprimer / Valider (2e)
 *  - QM_SEGMENT : Valider (1re)
 *  - Tous    : Consulter
 */
@RestController
@RequestMapping("/api/entretiens-mesures")
public class EntretienMesureController {

    private final EntretienMesureService service;

    public EntretienMesureController(EntretienMesureService service) {
        this.service = service;
    }

    @PostMapping("/{matricule}")
    @PreAuthorize("hasAuthority('mesure:create')")
    public ResponseEntity<EntretienMesure> create(
            @PathVariable String matricule,
            @RequestBody EntretienMesureRequestDTO dto,
            Authentication authentication) {

        String expediteurEmail = authentication.getName();
        EntretienMesure saved = service.createAvecNotification(matricule, dto, expediteurEmail);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{matricule}/{id}")
    @PreAuthorize("hasAuthority('mesure:update')")
    public ResponseEntity<EntretienMesure> update(
            @PathVariable String matricule,
            @PathVariable Long id,
            @RequestBody EntretienMesureRequestDTO dto,
            Authentication authentication) {

        String expediteurEmail = authentication.getName();
        EntretienMesure updated = service.updateAvecNotification(id, matricule, dto, expediteurEmail);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{matricule}/{id}")
    @PreAuthorize("hasAuthority('mesure:delete')")
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

    /** 1re validation — QM_SEGMENT */
    @PostMapping("/{matricule}/{id}/valider1")
    @PreAuthorize("hasAuthority('mesure:validate1')")
    public ResponseEntity<EntretienMesure> valider1(
            @PathVariable String matricule,
            @PathVariable Long id,
            @RequestBody EntretienMesureRequestDTO dto,
            Authentication authentication) {

        String expediteurEmail = authentication.getName();
        EntretienMesure updated = service.updateAvecNotification(id, matricule, dto, expediteurEmail);
        return ResponseEntity.ok(updated);
    }

    /** 2e validation — SGL */
    @PostMapping("/{matricule}/{id}/valider2")
    @PreAuthorize("hasAuthority('mesure:validate2')")
    public ResponseEntity<EntretienMesure> valider2(
            @PathVariable String matricule,
            @PathVariable Long id,
            @RequestBody EntretienMesureRequestDTO dto,
            Authentication authentication) {

        String expediteurEmail = authentication.getName();
        EntretienMesure updated = service.updateAvecNotification(id, matricule, dto, expediteurEmail);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{matricule}")
    @PreAuthorize("hasAuthority('mesure:read')")
    public List<EntretienMesure> get(@PathVariable String matricule) {
        return service.getByMatricule(matricule);
    }
}