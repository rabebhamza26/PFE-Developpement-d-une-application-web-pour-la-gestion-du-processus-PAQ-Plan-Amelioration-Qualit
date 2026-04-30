package com.polytech.paqbackend.controller;


import com.polytech.paqbackend.entity.Faute;
import com.polytech.paqbackend.repository.FauteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/fautes")
public class FauteController {

    @Autowired
    private FauteRepository fauteRepository;

    public static class FauteRequest {
        private String nom;

        public String getNom() { return nom; }
        public void setNom(String nom) { this.nom = nom; }
    }

    // GET ALL
    @GetMapping
    public ResponseEntity<List<Faute>> getAll() {
        List<Faute> fautes = fauteRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Faute::getNom))
                .toList();

        return ResponseEntity.ok(fautes);
    }

    // SEARCH
    @GetMapping("/search")
    public List<Faute> search(@RequestParam String q) {
        return fauteRepository.findByNomContainingIgnoreCase(q);
    }

    // CREATE
    @PostMapping
    public ResponseEntity<?> create(@RequestBody FauteRequest request) {

        if (request.getNom() == null || request.getNom().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Le nom est obligatoire"));
        }

        Optional<Faute> existing = fauteRepository.findByNom(request.getNom().trim());

        if (existing.isPresent()) {
            return ResponseEntity.ok(existing.get());
        }

        Faute faute = new Faute(request.getNom().trim());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(fauteRepository.save(faute));
    }
}