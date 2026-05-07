package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.CollaborateurDTO;
import com.polytech.paqbackend.entity.Collaborator;
import com.polytech.paqbackend.repository.CollaboratorRepository;
import com.polytech.paqbackend.service.CollaboratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Collaborateurs :
 *  - SL : CRUD complet
 *  - Tous authentifiés : Consulter
 */
@RestController
@RequestMapping("/api/collaborators")
public class CollaboratorController {

    @Autowired private CollaboratorRepository  repo;
    @Autowired private CollaboratorService     collaboratorService;

    @GetMapping("/view")
    @PreAuthorize("hasAuthority('collaborateur:read')")
    public ResponseEntity<List<CollaborateurDTO>> getAll() {
        try {
            return ResponseEntity.ok(repo.getAllWithPaq());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('collaborateur:create')")
    public ResponseEntity<?> create(@RequestBody Collaborator c) {
        try {
            if (c.getMatricule() == null || c.getMatricule().isBlank())
                return ResponseEntity.badRequest().body(Map.of("message", "Le matricule est obligatoire"));
            if (repo.existsByMatricule(c.getMatricule()))
                return ResponseEntity.badRequest().body(Map.of("message", "Matricule déjà existant"));
            if (c.getName() == null || c.getName().isBlank())
                return ResponseEntity.badRequest().body(Map.of("message", "Le nom est obligatoire"));
            if (c.getHireDate() == null)
                return ResponseEntity.badRequest().body(Map.of("message", "La date d'embauche est obligatoire"));

            return ResponseEntity.status(HttpStatus.CREATED).body(collaboratorService.create(c));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur : " + e.getMessage()));
        }
    }

    @PutMapping("/{matricule}")
    @PreAuthorize("hasAuthority('collaborateur:update')")
    public ResponseEntity<?> update(@PathVariable String matricule, @RequestBody Collaborator c) {
        try {
            if (!repo.existsById(matricule))
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Collaborateur non trouvé"));
            return ResponseEntity.ok(collaboratorService.update(matricule, c));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur : " + e.getMessage()));
        }
    }

    @DeleteMapping("/{matricule}")
    @PreAuthorize("hasAuthority('collaborateur:delete')")
    public ResponseEntity<?> delete(@PathVariable String matricule) {
        try {
            if (!repo.existsById(matricule))
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Collaborateur non trouvé"));
            repo.deleteById(matricule);
            return ResponseEntity.ok(Map.of("message", "Supprimé avec succès"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur : " + e.getMessage()));
        }
    }

    @GetMapping("/{matricule}")
    @PreAuthorize("hasAuthority('collaborateur:read')")
    public ResponseEntity<?> getCollaborator(@PathVariable String matricule) {
        try {
            Optional<Collaborator> col = repo.findById(matricule);
            return col.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur : " + e.getMessage()));
        }
    }
}