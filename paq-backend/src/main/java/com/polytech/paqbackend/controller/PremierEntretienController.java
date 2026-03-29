package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.entity.PremierEntretien;
import com.polytech.paqbackend.repository.PremierEntretienRepository;
import com.polytech.paqbackend.service.MailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/entretiens")
public class PremierEntretienController {

    private final PremierEntretienRepository repo;
    private final MailService mailService;

    public PremierEntretienController(PremierEntretienRepository repo, MailService mailService) {
        this.repo = repo;
        this.mailService = mailService;
    }

    @PostMapping
    public ResponseEntity<PremierEntretien> create(@RequestBody PremierEntretien e) {
        PremierEntretien saved = repo.save(e);
        mailService.sendEntretienMail(saved.getMatricule(), saved);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PremierEntretien> update(@PathVariable Long id, @RequestBody PremierEntretien e) {
        PremierEntretien exist = repo.findById(id).orElseThrow(() -> new RuntimeException("Entretien non trouvé"));
        exist.setTypeFaute(e.getTypeFaute());
        exist.setGravite(e.getGravite());
        exist.setDateFaute(e.getDateFaute());
        exist.setDescription(e.getDescription());
        exist.setMesuresCorrectives(e.getMesuresCorrectives());
        exist.setCommentaire(e.getCommentaire());
        exist.setSignatureBase64(e.getSignatureBase64());
        repo.save(exist);
        mailService.sendEntretienMail(exist.getMatricule(), exist);
        return ResponseEntity.ok(exist);
    }

    @GetMapping("/matricule/{matricule}")
    public ResponseEntity<List<PremierEntretien>> getByMatricule(@PathVariable String matricule) {
        List<PremierEntretien> list = repo.findByMatricule(matricule);
        return ResponseEntity.ok(list);
    }
}