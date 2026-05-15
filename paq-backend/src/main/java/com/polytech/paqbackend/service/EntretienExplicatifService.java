package com.polytech.paqbackend.service;

import com.polytech.paqbackend.controller.PaqController;
import com.polytech.paqbackend.dto.EntretienExplicatifDTO;
import com.polytech.paqbackend.entity.EntretienExplicatif;
import com.polytech.paqbackend.entity.PaqDossier;
import com.polytech.paqbackend.repository.CollaboratorRepository;
import com.polytech.paqbackend.repository.EntretienExplicatifRepository;
import com.polytech.paqbackend.repository.PaqRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.time.LocalDate;
import java.util.*;

@Service
@Transactional
public class EntretienExplicatifService {

    private static final Logger log = LoggerFactory.getLogger(EntretienExplicatifService.class);

    private final EntretienExplicatifRepository entretienRepo;
    private final CollaboratorRepository collaborateurRepo;
    private final PaqRepository paqRepository;
    private final ObjectMapper objectMapper;

    public EntretienExplicatifService(EntretienExplicatifRepository entretienRepo,
                                      CollaboratorRepository collaborateurRepo,
                                      PaqRepository paqRepository) {
        this.entretienRepo = entretienRepo;
        this.collaborateurRepo = collaborateurRepo;
        this.paqRepository = paqRepository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    private String addHistorique(String historiqueJson, PaqController.HistoriqueEvent event) {
        try {
            List<PaqController.HistoriqueEvent> list;
            if (historiqueJson == null || historiqueJson.isBlank() || "[]".equals(historiqueJson)) {
                list = new ArrayList<>();
            } else {
                list = objectMapper.readValue(historiqueJson,
                        new TypeReference<List<PaqController.HistoriqueEvent>>() {});
            }
            list.add(event);
            list.sort(Comparator.comparing(PaqController.HistoriqueEvent::getDate));
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            log.error("Erreur mise à jour historique", e);
            return String.format("[{\"date\":\"%s\",\"action\":\"%s\",\"detail\":\"%s\"}]",
                    event.getDate(), event.getAction(), event.getDetail());
        }
    }

    // Méthode create avec 3 paramètres (matricule, dto, expediteurEmail)
    public EntretienExplicatif create(String matricule, EntretienExplicatifDTO dto, String expediteurEmail) {
        EntretienExplicatif e = new EntretienExplicatif();
        e.setMatricule(matricule);
        mapDtoToEntity(dto, e);
        EntretienExplicatif saved = entretienRepo.save(e);

        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);

        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();

            if (paq.getNiveau() > 1) {
                throw new RuntimeException("Le niveau actuel (" + paq.getNiveau() + ") ne permet pas l'entretien explicatif");
            }

            LocalDate dateEntretien = dto.getDate() != null ? dto.getDate() : LocalDate.now();

            if (paq.getNiveau() == 0) {
                paq.setNiveau(1);
                paq.setDatePremierEntretien(dateEntretien);
            }

            String notes = "Type faute: " + dto.getTypeFaute()
                    + " | Description: " + (dto.getDescription() != null ? dto.getDescription() : "")
                    + " | Mesures: " + (dto.getMesuresCorrectives() != null ? dto.getMesuresCorrectives() : "");
            paq.setPremierEntretienNotes(notes);

            // Pour la création, on ajoute "ENTRETIEN EXPLICATIF"
            String historique = addHistorique(
                    paq.getHistorique(),
                    new PaqController.HistoriqueEvent(
                            dateEntretien,
                            "ENTRETIEN EXPLICATIF",
                            String.format("Entretien explicatif créé le %s — Faute : %s",
                                    dateEntretien, dto.getTypeFaute())
                    )
            );
            paq.setHistorique(historique);
            paqRepository.save(paq);

            log.info("PAQ mis à jour pour le matricule {}", matricule);
        } else {
            log.warn("Aucun PAQ actif trouvé pour le matricule {}", matricule);
        }

        return saved;
    }

    // Méthode update avec 4 paramètres (id, matricule, dto, expediteurEmail)
    public EntretienExplicatif update(Long id, String matricule, EntretienExplicatifDTO dto, String expediteurEmail) {
        EntretienExplicatif existing = entretienRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entretien introuvable: " + id));

        mapDtoToEntity(dto, existing);
        EntretienExplicatif updated = entretienRepo.save(existing);

        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);

        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();

            String notes = "Type faute: " + dto.getTypeFaute()
                    + " | Description: " + (dto.getDescription() != null ? dto.getDescription() : "")
                    + " | Mesures: " + (dto.getMesuresCorrectives() != null ? dto.getMesuresCorrectives() : "");
            paq.setPremierEntretienNotes(notes);

            // UNIQUEMENT "MODIFICATION ENTRETIEN EXPLICATIF" - PAS DE VALIDATION SUPPLÉMENTAIRE
            String historique = addHistorique(
                    paq.getHistorique(),
                    new PaqController.HistoriqueEvent(
                            LocalDate.now(),
                            "MODIFICATION ENTRETIEN EXPLICATIF",
                            String.format("Entretien explicatif modifié le %s par %s", LocalDate.now(), expediteurEmail)
                    )
            );
            paq.setHistorique(historique);
            paqRepository.save(paq);

            log.info("Historique mis à jour avec MODIFICATION pour l'entretien {} du matricule {}", id, matricule);
        }

        return updated;
    }

    // Méthode validate avec 2 paramètres (id, expediteurEmail)
    public void validate(Long id, String expediteurEmail) {
        EntretienExplicatif entretien = entretienRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entretien introuvable: " + id));

        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(entretien.getMatricule());

        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();

            // Vérifier si l'entretien a déjà été validé pour éviter les doublons
            boolean alreadyValidated = false;
            if (paq.getHistorique() != null && !paq.getHistorique().isEmpty()) {
                try {
                    List<PaqController.HistoriqueEvent> historique = objectMapper.readValue(
                            paq.getHistorique(),
                            new TypeReference<List<PaqController.HistoriqueEvent>>() {});
                    alreadyValidated = historique.stream()
                            .anyMatch(event -> "VALIDATION ENTRETIEN EXPLICATIF".equals(event.getAction()));
                } catch (Exception e) {
                    log.warn("Erreur lors de la vérification de l'historique", e);
                }
            }

            // Ajouter la validation seulement si elle n'existe pas déjà
            if (!alreadyValidated) {
                String historique = addHistorique(
                        paq.getHistorique(),
                        new PaqController.HistoriqueEvent(
                                LocalDate.now(),
                                "VALIDATION ENTRETIEN EXPLICATIF",
                                String.format("Entretien explicatif validé le %s par %s", LocalDate.now(), expediteurEmail)
                        )
                );
                paq.setHistorique(historique);
                paqRepository.save(paq);
                log.info("Entretien explicatif {} validé par {}", id, expediteurEmail);
            } else {
                log.info("Entretien explicatif {} déjà validé, aucune nouvelle entrée d'historique ajoutée", id);
            }
        }
    }

    public List<EntretienExplicatif> findByMatricule(String matricule) {
        return entretienRepo.findByMatricule(matricule);
    }

    public EntretienExplicatif findById(Long id) {
        return entretienRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entretien introuvable: " + id));
    }

    public void delete(Long id) {
        entretienRepo.deleteById(id);
    }

    private void mapDtoToEntity(EntretienExplicatifDTO dto, EntretienExplicatif e) {
        e.setTypeFaute(dto.getTypeFaute());
        e.setDateFaute(dto.getDate());
        e.setDescription(dto.getDescription());
        e.setMesuresCorrectives(dto.getMesuresCorrectives());
        e.setCommentaire(dto.getNotes());
    }
}