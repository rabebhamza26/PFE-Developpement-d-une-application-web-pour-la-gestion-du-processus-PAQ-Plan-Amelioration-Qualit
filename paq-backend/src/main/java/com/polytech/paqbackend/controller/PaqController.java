package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.entity.Collaborator;
import com.polytech.paqbackend.entity.PaqDossier;
import com.polytech.paqbackend.repository.CollaboratorRepository;
import com.polytech.paqbackend.repository.PaqRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/paq")
@CrossOrigin(origins = "http://localhost:5177")
public class PaqController {

    @Autowired
    private PaqRepository paqRepository;

    @Autowired
    private CollaboratorRepository collaboratorRepository;

    // GET dossier PAQ par matricule
    @GetMapping("/{matricule}")
    public PaqDossier getPaq(@PathVariable String matricule) {
        Optional<PaqDossier> paq = paqRepository.findByCollaboratorMatricule(matricule);
        return paq.orElse(null);
    }

    // POST créer dossier PAQ si 6 mois passés + ajoute un événement dans l'historique
    @PostMapping
    public PaqDossier createPaq(@RequestParam String matricule) {
        // Vérifier si PAQ existe déjà
        Optional<PaqDossier> paqOpt = paqRepository.findByCollaboratorMatricule(matricule);
        if (paqOpt.isPresent()) return paqOpt.get();

        // Vérifier collaborateur
        Optional<Collaborator> collabOpt = collaboratorRepository.findByMatricule(matricule);
        if (collabOpt.isEmpty()) return null;

        Collaborator collab = collabOpt.get();

        // Vérifier si 6 mois passés
        if (collab.getHireDate().plusMonths(6).isAfter(LocalDate.now())) return null;

        // Créer PAQ
        PaqDossier paq = new PaqDossier();
        paq.setCollaboratorMatricule(matricule);
        paq.setCreatedAt(LocalDate.now().atStartOfDay());
        paq.setNiveau(1);

        // Ajouter l'événement dans l'historique
        String historyJson = """
            [
                {
                    "date": "%s",
                    "action": "Création dossier PAQ",
                    "detail": "Dossier généré automatiquement après 6 mois"
                }
            ]
        """.formatted(LocalDate.now());
        paq.setHistorique(historyJson);

        return paqRepository.save(paq);
    }

    // PUT modifier dossier PAQ
    @PutMapping("/{id}")
    public PaqDossier updatePaq(@PathVariable Long id, @RequestBody PaqDossier updated) {
        Optional<PaqDossier> paqOpt = paqRepository.findById(String.valueOf(id));
        if (paqOpt.isEmpty()) return null;

        PaqDossier paq = paqOpt.get();
        paq.setNiveau(updated.getNiveau());
        paq.setHistorique(updated.getHistorique());
        return paqRepository.save(paq);
    }

    // GET historique PAQ
    @GetMapping("/history/{matricule}")
    public String getHistory(@PathVariable String matricule) {
        Optional<PaqDossier> paq = paqRepository.findByCollaboratorMatricule(matricule);
        return paq.map(PaqDossier::getHistorique).orElse("[]");
    }

    // GET tous les dossiers (optionnel)
    @GetMapping("/all")
    public List<PaqDossier> getAll() {
        return paqRepository.findAll();
    }
}