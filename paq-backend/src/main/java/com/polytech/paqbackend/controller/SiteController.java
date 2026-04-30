package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.entity.Plant;
import com.polytech.paqbackend.entity.Site;
import com.polytech.paqbackend.service.PlantService;
import com.polytech.paqbackend.service.SiteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sites")
public class SiteController {

    private final SiteService siteService;

    public SiteController(SiteService siteService) {
        this.siteService = siteService;
    }

    @GetMapping
    public ResponseEntity<List<Site>> getAllSites() {
        return ResponseEntity.ok(siteService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Site> getSiteById(@PathVariable Long id) {
        return ResponseEntity.ok(siteService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Site> createSite(@RequestBody Site site) {
        return ResponseEntity.ok(siteService.save(site));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Site> updateSite(@PathVariable Long id, @RequestBody Site site) {
        return ResponseEntity.ok(siteService.update(id, site));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSite(@PathVariable Long id) {
        siteService.delete(id);
        return ResponseEntity.noContent().build();
    }
}