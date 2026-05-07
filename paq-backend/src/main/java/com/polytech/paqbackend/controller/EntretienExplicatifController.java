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

/**
 * Entretien Explicatif (niveau 1)
 *
 * Règles métier :
 *  - SL et SGL : Créer / Modifier / Supprimer / Valider
 *  - Tous les rôles authentifiés : Consulter
 *
 * Cas particulier "Défaut grave" : le SGL est notifié par DefautGraveController
 * et doit intervenir dès le niveau 1.
 */
@RestController
@RequestMapping("/api/entretiens")
public class EntretienExplicatifController {

    private final EntretienExplicatifService service;

    public EntretienExplicatifController(EntretienExplicatifService service) {
        this.service = service;
    }

    // ── CRÉER ─────────────────────────────────────────────────────────────────
    @PostMapping("/{matricule}")
    @PreAuthorize("hasAuthority('explicatif:create')")
    public ResponseEntity<EntretienExplicatif> create(
            @PathVariable String matricule,
            @RequestParam(defaultValue = "1") int niveau,
            @RequestBody EntretienExplicatifDTO dto,
            Authentication authentication) {

        String expediteurEmail = authentication.getName();
        EntretienExplicatif created = service.createAvecNotification(
                matricule, dto, niveau, expediteurEmail);
        return ResponseEntity.ok(created);
    }

    // ── MODIFIER ──────────────────────────────────────────────────────────────
    @PutMapping("/{matricule}/{id}")
    @PreAuthorize("hasAuthority('explicatif:update')")
    public ResponseEntity<EntretienExplicatif> update(
            @PathVariable String matricule,
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int niveau,
            @RequestBody EntretienExplicatifDTO dto,
            Authentication authentication) {

        String expediteurEmail = authentication.getName();
        EntretienExplicatif updated = service.updateAvecNotification(
                id, matricule, dto, niveau, expediteurEmail);
        return ResponseEntity.ok(updated);
    }

    // ── SUPPRIMER ─────────────────────────────────────────────────────────────
    @DeleteMapping("/{matricule}/{id}")
    @PreAuthorize("hasAuthority('explicatif:delete')")
    public ResponseEntity<Void> delete(
            @PathVariable String matricule,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {

        String expediteurEmail    = authentication.getName();
        String destinataireEmail  = body != null ? body.get("destinataireEmail") : null;
        String nomCollab          = body != null ? body.get("nomCollab") : matricule;

        service.deleteAvecNotification(id, matricule, expediteurEmail, destinataireEmail, nomCollab);
        return ResponseEntity.noContent().build();
    }

    // ── CONSULTER par matricule ───────────────────────────────────────────────
    @GetMapping("/matricule/{matricule}")
    @PreAuthorize("hasAuthority('explicatif:read')")
    public ResponseEntity<List<EntretienExplicatif>> getByMatricule(
            @PathVariable String matricule) {
        return ResponseEntity.ok(service.findByMatricule(matricule));
    }

    // ── CONSULTER par id ─────────────────────────────────────────────────────
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('explicatif:read')")
    public ResponseEntity<EntretienExplicatif> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }
}