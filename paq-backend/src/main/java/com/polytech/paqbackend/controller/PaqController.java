package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.entity.Collaborator;
import com.polytech.paqbackend.entity.PaqDossier;
import com.polytech.paqbackend.repository.CollaboratorRepository;
import com.polytech.paqbackend.repository.PaqRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

import java.util.*;

@RestController
@RequestMapping("/api/paq")
public class PaqController {



        @Autowired
        private PaqRepository paqRepository;

        @Autowired
        private CollaboratorRepository collaboratorRepository;

        private final ObjectMapper objectMapper = new ObjectMapper();

        public static class HistoriqueEvent {
            private LocalDate date;
            private String action;
            private String detail;

            public HistoriqueEvent() {}
            public HistoriqueEvent(LocalDate date, String action, String detail) {
                this.date = date;
                this.action = action;
                this.detail = detail;
            }
            public LocalDate getDate() { return date; }
            public void setDate(LocalDate date) { this.date = date; }
            public String getAction() { return action; }
            public void setAction(String action) { this.action = action; }
            public String getDetail() { return detail; }
            public void setDetail(String detail) { this.detail = detail; }
        }

        public static class EntretienRequest {
            private String notes;
            private LocalDate date;
            public String getNotes() { return notes; }
            public void setNotes(String notes) { this.notes = notes; }
            public LocalDate getDate() { return date; }
            public void setDate(LocalDate date) { this.date = date; }
        }

        public static class FauteRequest {
            private String detail;
            private String type;
            public String getDetail() { return detail; }
            public void setDetail(String detail) { this.detail = detail; }
            public String getType() { return type; }
            public void setType(String type) { this.type = type; }
        }

        private String addHistorique(String historiqueJson, HistoriqueEvent event) {
            try {
                List<HistoriqueEvent> list;
                if (historiqueJson == null || historiqueJson.isBlank() || "[]".equals(historiqueJson)) {
                    list = new ArrayList<>();
                } else {
                    list = objectMapper.readValue(historiqueJson, new TypeReference<List<HistoriqueEvent>>() {});
                }
                list.add(event);
                list.sort(Comparator.comparing(HistoriqueEvent::getDate));
                return objectMapper.writeValueAsString(list);
            } catch (Exception e) {
                return String.format("[{\"date\":\"%s\",\"action\":\"%s\",\"detail\":\"%s\"}]",
                        event.getDate(), event.getAction(), event.getDetail());
            }
        }

        private boolean peutCreerPaq(Collaborator collaborator) {
            if (collaborator.getHireDate() == null) return false;
            LocalDate sixMonthsAgo = LocalDate.now().minusMonths(6);
            return !collaborator.getHireDate().isAfter(sixMonthsAgo);
        }

        @GetMapping("/{matricule}")
        public ResponseEntity<?> getPaqByMatricule(@PathVariable String matricule) {
            Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
            if (paqOpt.isPresent()) return ResponseEntity.ok(paqOpt.get());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Aucun dossier PAQ actif trouvé pour le matricule: " + matricule));
        }

        @GetMapping("/history/{matricule}")
        public ResponseEntity<?> getAllPaqsByMatricule(@PathVariable String matricule) {
            return ResponseEntity.ok(paqRepository.findAllByCollaboratorMatriculeOrderByDateCreationDesc(matricule));
        }

        @GetMapping("/all")
        public ResponseEntity<List<PaqDossier>> getAllPaqs() {
            return ResponseEntity.ok(paqRepository.findAll());
        }

        @GetMapping("/{matricule}/history")
        public ResponseEntity<?> getHistory(@PathVariable String matricule) {
            Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
            if (paqOpt.isEmpty()) return ResponseEntity.ok(new ArrayList<>());

            try {
                List<HistoriqueEvent> events = objectMapper.readValue(
                        paqOpt.get().getHistorique(),
                        new TypeReference<List<HistoriqueEvent>>() {}
                );
                events.sort(Comparator.comparing(HistoriqueEvent::getDate));
                return ResponseEntity.ok(events);
            } catch (Exception e) {
                return ResponseEntity.ok(new ArrayList<>());
            }
        }

        @PostMapping("/create/{matricule}")
        public ResponseEntity<?> createPaq(@PathVariable String matricule) {
            Optional<Collaborator> collabOpt = collaboratorRepository.findById(matricule);
            if (collabOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Collaborateur non trouvé"));
            }

            Collaborator collaborator = collabOpt.get();

            if (!peutCreerPaq(collaborator)) {
                long moisRestants = 6 - ChronoUnit.MONTHS.between(collaborator.getHireDate(), LocalDate.now());
                return ResponseEntity.badRequest().body(Map.of("message",
                        String.format("PAQ disponible après 6 mois d'ancienneté. Encore %d mois.", moisRestants)));
            }

            Optional<PaqDossier> existing = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
            if (existing.isPresent()) {
                return ResponseEntity.ok(existing.get());
            }

            PaqDossier paq = new PaqDossier();
            paq.setCollaboratorMatricule(matricule);
            paq.setDateCreation(LocalDate.now());
            paq.setDateFin(LocalDate.now().plusMonths(6));
            paq.setCreatedAt(LocalDateTime.now());
            paq.setNiveau(0);
            paq.setStatut("EN_COURS");
            paq.setActif(true);
            paq.setArchived(false);

            String historique = addHistorique(null, new HistoriqueEvent(
                    LocalDate.now(),
                    "Création du dossier PAQ",
                    String.format("Dossier créé après %d mois d'ancienneté",
                            ChronoUnit.MONTHS.between(collaborator.getHireDate(), LocalDate.now()))
            ));
            paq.setHistorique(historique);

            PaqDossier saved = paqRepository.save(paq);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        }

        @PostMapping("/{matricule}/faute")
        public ResponseEntity<?> enregistrerFaute(
                @PathVariable String matricule,
                @RequestBody FauteRequest request) {

            Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
            if (paqOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Aucun dossier PAQ actif trouvé"));

            PaqDossier paq = paqOpt.get();

            if (paq.isArchived() || "CLOTURE".equals(paq.getStatut())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Dossier clôturé ou archivé"));
            }

            String detailFaute = request.getDetail() != null ? request.getDetail() : "Faute professionnelle";
            int ancienNiveau = paq.getNiveau();
            int nouveauNiveau = Math.max(0, ancienNiveau - 1);

            paq.setDerniereFaute(LocalDate.now());
            paq.setNiveau(nouveauNiveau);

            String historiqueMsg = String.format("Faute enregistrée - Niveau descendant de %d à %d",
                    ancienNiveau, nouveauNiveau);
            if (!detailFaute.isEmpty()) historiqueMsg += " - Détail: " + detailFaute;

            paq.setHistorique(addHistorique(paq.getHistorique(),
                    new HistoriqueEvent(LocalDate.now(), "Faute enregistrée", historiqueMsg)));

            if (nouveauNiveau == 0 && ancienNiveau > 0) {
                paq.setStatut("CRITIQUE");
                paq.setHistorique(addHistorique(paq.getHistorique(),
                        new HistoriqueEvent(LocalDate.now(), "Statut critique",
                                "Collaborateur en situation critique suite à une faute")));
            }

            PaqDossier saved = paqRepository.save(paq);
            return ResponseEntity.ok(saved);
        }

        @PostMapping("/{matricule}/upgrade")
        public ResponseEntity<?> upgradeNiveau(@PathVariable String matricule) {
            Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
            if (paqOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Aucun dossier PAQ actif trouvé"));

            PaqDossier paq = paqOpt.get();

            if (paq.getNiveau() >= 5) return ResponseEntity.badRequest().body(Map.of("message", "Niveau maximum atteint"));
            if (paq.isArchived() || "CLOTURE".equals(paq.getStatut())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Dossier clôturé ou archivé"));
            }

            int ancienNiveau = paq.getNiveau();
            int nouveauNiveau = ancienNiveau + 1;
            paq.setNiveau(nouveauNiveau);

            if ("CRITIQUE".equals(paq.getStatut())) {
                paq.setStatut("EN_COURS");
            }

            paq.setHistorique(addHistorique(paq.getHistorique(),
                    new HistoriqueEvent(LocalDate.now(), "Augmentation niveau",
                            String.format("Niveau passé de %d à %d", ancienNiveau, nouveauNiveau))));

            return ResponseEntity.ok(paqRepository.save(paq));
        }

        @PostMapping("/{matricule}/archive")
        public ResponseEntity<?> archivePaq(@PathVariable String matricule) {
            Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
            if (paqOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Aucun dossier PAQ actif trouvé"));

            PaqDossier paq = paqOpt.get();
            paq.setArchived(true);
            paq.setActif(false);
            paq.setStatut("ARCHIVE");

            paq.setHistorique(addHistorique(paq.getHistorique(),
                    new HistoriqueEvent(LocalDate.now(), "Archivage", "Dossier archivé")));

            return ResponseEntity.ok(paqRepository.save(paq));
        }

        // ---- ENTRETIENS ----
        @PostMapping("/{matricule}/premier-entretien")
        public ResponseEntity<?> createPremierEntretien(@PathVariable String matricule, @RequestBody EntretienRequest request) {
            return createEntretien(matricule, 1, request, "Premier entretien");
        }

        @PostMapping("/{matricule}/deuxieme-entretien")
        public ResponseEntity<?> createDeuxiemeEntretien(@PathVariable String matricule, @RequestBody EntretienRequest request) {
            return createEntretien(matricule, 2, request, "Deuxième entretien");
        }

        @PostMapping("/{matricule}/troisieme-entretien")
        public ResponseEntity<?> createTroisiemeEntretien(@PathVariable String matricule, @RequestBody EntretienRequest request) {
            return createEntretien(matricule, 3, request, "Troisième entretien");
        }

        @PostMapping("/{matricule}/quatrieme-entretien")
        public ResponseEntity<?> createQuatriemeEntretien(@PathVariable String matricule, @RequestBody EntretienRequest request) {
            return createEntretien(matricule, 4, request, "Quatrième entretien");
        }

        @PostMapping("/{matricule}/cinquieme-entretien")
        public ResponseEntity<?> createCinquiemeEntretien(@PathVariable String matricule, @RequestBody EntretienRequest request) {
            return createEntretien(matricule, 5, request, "Cinquième entretien - Clôture");
        }

        private ResponseEntity<?> createEntretien(String matricule, int niveau, EntretienRequest request, String entretienNom) {
            Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
            if (paqOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Aucun dossier PAQ actif trouvé"));

            PaqDossier paq = paqOpt.get();

            if (paq.isArchived() || "CLOTURE".equals(paq.getStatut())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Dossier clôturé ou archivé"));
            }
            if (paq.getNiveau() >= niveau) {
                return ResponseEntity.badRequest().body(Map.of("message", "Cet entretien a déjà été réalisé"));
            }
            if (paq.getNiveau() != niveau - 1) {
                return ResponseEntity.badRequest().body(Map.of("message", "Veuillez réaliser les entretiens dans l'ordre"));
            }

            LocalDate entretienDate = request.getDate() != null ? request.getDate() : LocalDate.now();
            String notes = request.getNotes() != null ? request.getNotes() : "";

            switch (niveau) {
                case 1 -> { paq.setDatePremierEntretien(entretienDate); paq.setPremierEntretienNotes(notes); }
                case 2 -> { paq.setDateDeuxiemeEntretien(entretienDate); paq.setDeuxiemeEntretienNotes(notes); }
                case 3 -> { paq.setDateTroisiemeEntretien(entretienDate); paq.setTroisiemeEntretienNotes(notes); }
                case 4 -> { paq.setDateQuatriemeEntretien(entretienDate); paq.setQuatriemeEntretienNotes(notes); }
                case 5 -> { paq.setDateCinquiemeEntretien(entretienDate); paq.setCinquiemeEntretienNotes(notes); paq.setStatut("CLOTURE"); }
            }

            paq.setNiveau(niveau);

            String detail = String.format("%s réalisé le %s", entretienNom, entretienDate);
            if (!notes.isEmpty()) detail += " - Notes: " + notes;

            paq.setHistorique(addHistorique(paq.getHistorique(),
                    new HistoriqueEvent(LocalDate.now(), entretienNom, detail)));

            return ResponseEntity.ok(paqRepository.save(paq));
        }
    }
