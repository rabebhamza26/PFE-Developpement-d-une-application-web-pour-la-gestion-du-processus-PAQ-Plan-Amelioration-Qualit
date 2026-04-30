package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.EntretienExplicatifDTO;
import com.polytech.paqbackend.entity.EntretienExplicatif;
import com.polytech.paqbackend.service.EntretienExplicatifService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST pour les entretiens explicatifs.
 *
 * Point clé : le endpoint POST /{matricule} accepte le paramètre `niveau`
 * pour déclencher les notifications appropriées selon le type d'entretien.
 *
 * L'email de l'utilisateur qui valide est extrait du JWT via Authentication
 * et transmis au service pour l'envoi des emails.
 */
@RestController
@RequestMapping("/api/entretiens")
public class EntretienExplicatifController {

    private final EntretienExplicatifService service;

    public EntretienExplicatifController(EntretienExplicatifService service) {
        this.service = service;
    }


    @PostMapping("/{matricule}")
    public ResponseEntity<EntretienExplicatif> create(
            @PathVariable String matricule,
            @RequestParam(defaultValue = "1") int niveau,
            @RequestBody EntretienExplicatifDTO dto,
            Authentication authentication) {

        // Email de l'utilisateur qui valide (SL en général)
        String expediteurEmail = authentication.getName();

        EntretienExplicatif created = service.createAvecNotification(
                matricule, dto, niveau, expediteurEmail
        );

        return ResponseEntity.ok(created);
    }

    /**
     * PUT /api/entretiens/{matricule}/{id}
     * Modification d'un entretien existant (sans re-notifier).
     */
    @PutMapping("/{matricule}/{id}")
    public ResponseEntity<EntretienExplicatif> update(
            @PathVariable String matricule,
            @PathVariable Long id,
            @RequestBody EntretienExplicatifDTO dto) {

        return ResponseEntity.ok(service.update(id, dto));
    }

    /**
     * GET /api/entretiens/matricule/{matricule}
     * Récupère tous les entretiens d'un collaborateur.
     */
    @GetMapping("/matricule/{matricule}")
    public ResponseEntity<List<EntretienExplicatif>> getByMatricule(
            @PathVariable String matricule) {
        return ResponseEntity.ok(service.findByMatricule(matricule));
    }

    /**
     * GET /api/entretiens/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<EntretienExplicatif> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    /**
     * DELETE /api/entretiens/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}