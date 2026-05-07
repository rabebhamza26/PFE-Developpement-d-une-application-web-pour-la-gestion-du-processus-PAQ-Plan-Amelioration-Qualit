package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.DefautGraveRequest;
import com.polytech.paqbackend.service.DefautGraveService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Endpoint pour déclarer un défaut grave.
 *
 * Seuls SL, SGL  peuvent déclencher ce processus.
 * → Notifie immédiatement tous les SGL (système + email).
 */
@RestController
@RequestMapping("/api/defaut-grave")
public class DefautGraveController {

    private final DefautGraveService defautGraveService;

    public DefautGraveController(DefautGraveService defautGraveService) {
        this.defautGraveService = defautGraveService;
    }

    /**
     * POST /api/defaut-grave/notifier
     * Body : { matricule, descriptionDefaut, sglEmail (optionnel) }
     *
     * Déclenche :
     *  1. Notification in-app à tous les SGL actifs
     *  2. Email à tous les SGL actifs
     */
    @PostMapping("/notifier")
    @PreAuthorize("hasAuthority('defaut:grave:notify')")
    public ResponseEntity<Map<String, String>> notifier(
            @RequestBody DefautGraveRequest request,
            Authentication authentication) {

        String expediteurLogin = authentication.getName();
        defautGraveService.notifierDefautGrave(request, expediteurLogin);

        return ResponseEntity.ok(Map.of(
                "statut", "notifié",
                "matricule", request.getMatricule(),
                "message", "Les SGL ont été notifiés du défaut grave."
        ));
    }
}