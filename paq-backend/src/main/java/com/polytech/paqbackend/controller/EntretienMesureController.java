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

@RestController
@RequestMapping("/api/entretiens-mesures")
public class EntretienMesureController {

    private final EntretienMesureService service;

    public EntretienMesureController(EntretienMesureService service) {
        this.service = service;
    }

    /**
     * SL : Créer l'entretien de mesure
     * → Envoie email "Merci d'assister à l'entretien" à tous les QM_SEGMENT et SGL
     */
    @PostMapping("/{matricule}")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<EntretienMesure> create(@PathVariable String matricule,
                                                  @RequestBody EntretienMesureRequestDTO dto,
                                                  Authentication authentication) {
        return ResponseEntity.ok(
                service.createAvecNotification(matricule, dto, authentication.getName())
        );
    }

    /**
     * SL : Modifier l'entretien de mesure
     * → Envoie email "Merci d'assister à l'entretien" à tous les QM_SEGMENT et SGL
     */
    @PutMapping("/{matricule}/{id}")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<EntretienMesure> update(@PathVariable String matricule,
                                                  @PathVariable Long id,
                                                  @RequestBody EntretienMesureRequestDTO dto,
                                                  Authentication authentication) {
        return ResponseEntity.ok(
                service.updateAvecNotification(id, matricule, dto, authentication.getName())
        );
    }

    /**
     * QM_SEGMENT : 1ère validation
     * → Pas d'email, mise à jour de l'historique PAQ uniquement
     */
    @PostMapping("/{matricule}/{id}/valider1")
    @PreAuthorize("hasRole('QM_SEGMENT')")
    public ResponseEntity<EntretienMesure> valider1(@PathVariable String matricule,
                                                    @PathVariable Long id,
                                                    @RequestBody EntretienMesureRequestDTO dto,
                                                    Authentication authentication) {
        return ResponseEntity.ok(
                service.valider1AvecHistorique(id, matricule, dto, authentication.getName())
        );
    }

    /**
     * SGL : 2ème validation
     * → Pas d'email, mise à jour de l'historique PAQ uniquement
     */
    @PostMapping("/{matricule}/{id}/valider2")
    @PreAuthorize("hasRole('SGL')")
    public ResponseEntity<EntretienMesure> valider2(@PathVariable String matricule,
                                                    @PathVariable Long id,
                                                    @RequestBody EntretienMesureRequestDTO dto,
                                                    Authentication authentication) {
        return ResponseEntity.ok(
                service.valider2AvecHistorique(id, matricule, dto, authentication.getName())
        );
    }

    /**
     * SL : Supprimer l'entretien de mesure
     */
    @DeleteMapping("/{matricule}/{id}")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<Void> delete(@PathVariable String matricule,
                                       @PathVariable Long id,
                                       @RequestBody(required = false) Map<String, String> body,
                                       Authentication authentication) {
        String destinataireEmail = body != null ? body.get("destinataireEmail") : null;
        String nomCollab = body != null ? body.get("nomCollab") : matricule;
        service.deleteAvecNotification(id, matricule, authentication.getName(),
                destinataireEmail, nomCollab);
        return ResponseEntity.noContent().build();
    }


    // Dans EntretienMesureController.java

    /**
     * SL : Créer l'entretien de mesure avec notification
     * → Envoie email "Merci d'assister à l'entretien" aux destinataires sélectionnés
     */
    @PostMapping("/{matricule}/with-notification")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<EntretienMesure> createWithNotification(
            @PathVariable String matricule,
            @RequestBody EntretienMesureRequestDTO dto,
            @RequestParam String expediteurEmail) {
        return ResponseEntity.ok(
                service.createAvecNotificationMulti(matricule, dto, expediteurEmail,
                        dto.getDestinataireEmail() != null ? List.of(dto.getDestinataireEmail()) : null)
        );
    }

    /**
     * SL : Modifier l'entretien de mesure avec notification
     * → Envoie email "Merci d'assister à l'entretien" aux destinataires sélectionnés
     */
    @PutMapping("/{matricule}/{id}/with-notification")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<EntretienMesure> updateWithNotification(
            @PathVariable String matricule,
            @PathVariable Long id,
            @RequestBody EntretienMesureRequestDTO dto,
            @RequestParam String expediteurEmail) {
        return ResponseEntity.ok(
                service.updateAvecNotification(id, matricule, dto, expediteurEmail)
        );
    }

    /**
     * Tous les utilisateurs authentifiés : Consultation
     */
    @GetMapping("/{matricule}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<EntretienMesure>> get(@PathVariable String matricule) {
        return ResponseEntity.ok(service.getByMatricule(matricule));
    }
}