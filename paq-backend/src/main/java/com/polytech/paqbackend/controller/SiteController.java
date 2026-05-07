package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.SiteDTO;
import com.polytech.paqbackend.entity.Site;
import com.polytech.paqbackend.service.SiteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sites")
public class SiteController {

    private final SiteService siteService;

    @Autowired
    public SiteController(SiteService siteService) {
        this.siteService = siteService;
    }

    // ✅ PUBLIC — utilisé AVANT la connexion (page SiteSelection)
    // Pas de @PreAuthorize ici : la SecurityConfiguration autorise déjà
    // GET /api/sites en permitAll()
    @GetMapping
    public ResponseEntity<List<SiteDTO>> getAllSites() {
        List<SiteDTO> sites = siteService.getAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(sites);
    }

    // ✅ PUBLIC — même raison
    @GetMapping("/{id}")
    public ResponseEntity<SiteDTO> getSiteById(@PathVariable Long id) {
        Site site = siteService.getById(id);
        return ResponseEntity.ok(toDTO(site));
    }

    // 🔒 ADMIN seulement
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SiteDTO> createSite(@RequestBody Site site) {
        Site savedSite = siteService.save(site);
        return ResponseEntity.ok(toDTO(savedSite));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SiteDTO> updateSite(@PathVariable Long id, @RequestBody Site site) {
        Site updatedSite = siteService.update(id, site);
        return ResponseEntity.ok(toDTO(updatedSite));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSite(@PathVariable Long id) {
        siteService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private SiteDTO toDTO(Site site) {
        return new SiteDTO(site.getId(), site.getName());
    }
}