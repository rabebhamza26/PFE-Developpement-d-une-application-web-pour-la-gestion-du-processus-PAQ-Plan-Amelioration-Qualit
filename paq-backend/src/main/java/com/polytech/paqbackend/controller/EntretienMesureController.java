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

    @PostMapping("/{matricule}")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<EntretienMesure> create(@PathVariable String matricule,
                                                  @RequestBody EntretienMesureRequestDTO dto,
                                                  Authentication authentication) {
        return ResponseEntity.ok(service.createAvecNotification(matricule, dto, authentication.getName()));
    }

    @PutMapping("/{matricule}/{id}")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<EntretienMesure> update(@PathVariable String matricule,
                                                  @PathVariable Long id,
                                                  @RequestBody EntretienMesureRequestDTO dto,
                                                  Authentication authentication) {
        return ResponseEntity.ok(service.updateAvecNotification(id, matricule, dto, authentication.getName()));
    }

    // SL soumet pour validation (envoi email à QM_SEGMENT et SGL)
    @PostMapping("/{matricule}/{id}/valider-premiere")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<EntretienMesure> validerPremiere(@PathVariable String matricule,
                                                           @PathVariable Long id,
                                                           @RequestBody EntretienMesureRequestDTO dto,
                                                           Authentication authentication) {
        return ResponseEntity.ok(service.validerPremiere(id, matricule, dto, authentication.getName()));
    }

    // QM_SEGMENT valide (1ère validation)
    @PostMapping("/{matricule}/{id}/valider1")
    @PreAuthorize("hasRole('QM_SEGMENT')")
    public ResponseEntity<EntretienMesure> valider1(@PathVariable String matricule,
                                                    @PathVariable Long id,
                                                    @RequestBody EntretienMesureRequestDTO dto,
                                                    Authentication authentication) {
        return ResponseEntity.ok(service.valider1AvecHistorique(id, matricule, dto, authentication.getName()));
    }

    // SGL valide (2ème validation)
    @PostMapping("/{matricule}/{id}/valider2")
    @PreAuthorize("hasRole('SGL')")
    public ResponseEntity<EntretienMesure> valider2(@PathVariable String matricule,
                                                    @PathVariable Long id,
                                                    @RequestBody EntretienMesureRequestDTO dto,
                                                    Authentication authentication) {
        return ResponseEntity.ok(service.valider2AvecHistorique(id, matricule, dto, authentication.getName()));
    }



    @GetMapping("/matricule/{matricule}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<EntretienMesure>> getByMatricule(@PathVariable String matricule) {
        return ResponseEntity.ok(service.getByMatricule(matricule));
    }
}