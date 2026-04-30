package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.CollaborateurDTO;
import com.polytech.paqbackend.entity.Collaborator;
import com.polytech.paqbackend.repository.CollaboratorRepository;
import com.polytech.paqbackend.service.CollaboratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/collaborators")
public class CollaboratorController {

    @Autowired
    private CollaboratorRepository repo;

    @Autowired
    private CollaboratorService collaboratorService;

    /**
     * Récupère tous les collaborateurs avec leurs informations PAQ
     * GET /api/collaborators/view
     */
    @GetMapping("/view")
    public ResponseEntity<List<CollaborateurDTO>> getAll() {
        try {
            List<CollaborateurDTO> collaborators = repo.getAllWithPaq();
            return ResponseEntity.ok(collaborators);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Crée un nouveau collaborateur
     * POST /api/collaborators
     */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Collaborator c) {
        try {
            // Validation du matricule
            if (c.getMatricule() == null || c.getMatricule().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Le matricule est obligatoire"));
            }

            // Vérifier si le matricule existe déjà
            if (repo.existsByMatricule(c.getMatricule())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Un collaborateur avec ce matricule existe déjà"));
            }

            // Validation des champs obligatoires
            if (c.getName() == null || c.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Le nom est obligatoire"));
            }

            if (c.getPrenom() == null || c.getPrenom().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Le prénom est obligatoire"));
            }

            if (c.getSegment() == null || c.getSegment().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Le segment est obligatoire"));
            }

            if (c.getHireDate() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "La date d'embauche est obligatoire"));
            }

            // Utiliser le service pour créer avec la logique métier
            Collaborator saved = collaboratorService.create(c);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la création: " + e.getMessage()));
        }
    }

    /**
     * Met à jour un collaborateur existant
     * PUT /api/collaborators/{matricule}
     */
    @PutMapping("/{matricule}")
    public ResponseEntity<?> update(@PathVariable String matricule,
                                    @RequestBody Collaborator c) {
        try {
            // Vérifier si le collaborateur existe
            Optional<Collaborator> existingOpt = repo.findById(matricule);
            if (!existingOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Collaborateur non trouvé"));
            }

            Collaborator existing = existingOpt.get();

            // Mettre à jour les champs
            if (c.getName() != null && !c.getName().trim().isEmpty()) {
                existing.setName(c.getName());
            }

            if (c.getPrenom() != null && !c.getPrenom().trim().isEmpty()) {
                existing.setPrenom(c.getPrenom());
            }

            if (c.getSegment() != null && !c.getSegment().trim().isEmpty()) {
                existing.setSegment(c.getSegment());
            }

            if (c.getHireDate() != null) {
                existing.setHireDate(c.getHireDate());
            }

            // Sauvegarder les modifications
            Collaborator updated = repo.save(existing);
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la mise à jour: " + e.getMessage()));
        }
    }

    /**
     * Supprime un collaborateur
     * DELETE /api/collaborators/{matricule}
     */
    @DeleteMapping("/{matricule}")
    public ResponseEntity<?> delete(@PathVariable String matricule) {
        try {
            // Vérifier si le collaborateur existe
            if (!repo.existsById(matricule)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Collaborateur non trouvé"));
            }

            repo.deleteById(matricule);
            return ResponseEntity.ok(Map.of("message", "Collaborateur supprimé avec succès"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la suppression: " + e.getMessage()));
        }
    }

    /**
     * Récupère un collaborateur par son matricule
     * GET /api/collaborators/{matricule}
     */
    @GetMapping("/{matricule}")
    public ResponseEntity<?> getCollaborator(@PathVariable String matricule) {
        try {
            Optional<Collaborator> collaborator = repo.findById(matricule);

            if (collaborator.isPresent()) {
                return ResponseEntity.ok(collaborator.get());
            }

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Collaborateur non trouvé"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la récupération: " + e.getMessage()));
        }
    }
}