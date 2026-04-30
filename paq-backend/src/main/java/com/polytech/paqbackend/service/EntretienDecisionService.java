package com.polytech.paqbackend.service;

import com.polytech.paqbackend.controller.PaqController;
import com.polytech.paqbackend.dto.EntretienDecisionRequestDTO;
import com.polytech.paqbackend.entity.EntretienDecision;
import com.polytech.paqbackend.entity.PaqDossier;
import com.polytech.paqbackend.repository.EntretienDecisionRepository;
import com.polytech.paqbackend.repository.PaqRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.time.LocalDate;
import java.util.*;

@Service
public class EntretienDecisionService {

    private static final Logger log = LoggerFactory.getLogger(EntretienDecisionService.class);

    private final EntretienDecisionRepository repo;
    private final PaqRepository paqRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    public EntretienDecisionService(EntretienDecisionRepository repo,
                                    PaqRepository paqRepository,
                                    NotificationService notificationService,
                                    EmailService emailService) {
        this.repo = repo;
        this.paqRepository = paqRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
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
            return String.format("[{\"date\":\"%s\",\"action\":\"%s\",\"detail\":\"%s\"}]",
                    event.getDate(), event.getAction(), event.getDetail());
        }
    }

    public EntretienDecision create(String matricule, EntretienDecisionRequestDTO dto, String expediteurEmail) {

        // ── Vérifier le PAQ ───────────────────────────────────────────────
        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);

        if (paqOpt.isEmpty()) {
            throw new RuntimeException("Aucun dossier PAQ actif trouvé pour le matricule : " + matricule);
        }

        PaqDossier paq = paqOpt.get();

        if (paq.getNiveau() != 3) {
            throw new RuntimeException("Le niveau actuel (" + paq.getNiveau() + ") ne permet pas l'entretien de décision (niveau 3 requis)");
        }

        // ── Créer l'entretien ─────────────────────────────────────────────
        EntretienDecision entretien = new EntretienDecision();
        entretien.setMatricule(matricule);
        entretien.setTypeFaute(dto.getTypeFaute());
        entretien.setDateEntretien(dto.getDateEntretien() != null ? dto.getDateEntretien() : LocalDate.now());
        entretien.setDecision(dto.getDecision());
        entretien.setJustification(dto.getJustification());
        entretien.setSignatureSL(dto.getSignatureSL());
        entretien.setSignatureQM(dto.getSignatureQM());
        entretien.setSignatureSGL(dto.getSignatureSGL());
        entretien.setDateCreation(LocalDate.now());

        EntretienDecision saved = repo.save(entretien);

        // ── Mettre à jour le PAQ : niveau 4 ──────────────────────────────
        LocalDate dateReelle = entretien.getDateEntretien();

        paq.setNiveau(4);
        paq.setDateQuatriemeEntretien(dateReelle);

        String notes = "Type faute: " + dto.getTypeFaute()
                + " | Décision: " + dto.getDecision()
                + " | Justification: " + (dto.getJustification() != null ? dto.getJustification() : "");
        paq.setQuatriemeEntretienNotes(notes);

        String historique = addHistorique(paq.getHistorique(),
                new PaqController.HistoriqueEvent(dateReelle, "Entretien De Decision",
                        "Entretien de décision validé le " + dateReelle
                                + " — Décision : " + dto.getDecision()
                                + " — Faute : " + dto.getTypeFaute()));
        paq.setHistorique(historique);
        paqRepository.save(paq);

        // ── Envoi email si destinataire fourni ───────────────────────────
        if (dto.getDestinataireEmail() != null && !dto.getDestinataireEmail().isBlank()) {
            try {
                String sujet = "[PAQ] Entretien de décision validé - " + matricule;
                String html = buildEmailContent(matricule, dto);
                emailService.sendEmail(expediteurEmail, dto.getDestinataireEmail(), sujet, html);
                log.info("Email envoyé à {} pour l'entretien de décision de {}", dto.getDestinataireEmail(), matricule);
            } catch (Exception ex) {
                log.error("Erreur envoi email: {}", ex.getMessage());
            }
        }

        return saved;
    }

    private String buildEmailContent(String matricule, EntretienDecisionRequestDTO dto) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif;">
              <div style="max-width:600px;margin:auto;background:white;border-radius:8px;padding:20px;">
                <div style="background:#C8102E;padding:15px;border-radius:8px 8px 0 0;margin:-20px -20px 0 -20px;">
                  <h2 style="color:white;margin:0;">🏭 PAQ - Entretien de décision validé</h2>
                </div>
                <div style="padding:20px 0;">
                  <p>Bonjour,</p>
                  <p>Un entretien de décision a été validé pour le matricule <strong>%s</strong>.</p>
                  <table style="width:100%%;border-collapse:collapse;margin:20px 0;">
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Type de faute</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Date entretien</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Décision</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Justification</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                   </table>
                  <p>Veuillez vous connecter au système PAQ pour plus de détails.</p>
                </div>
              </div>
            </body>
            </html>
            """, matricule, dto.getTypeFaute(), dto.getDateEntretien(),
                dto.getDecision(), dto.getJustification());
    }

    public EntretienDecision findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Entretien de décision introuvable id=" + id));
    }

    public List<EntretienDecision> findByMatricule(String matricule) {
        return repo.findByMatricule(matricule);
    }

    public EntretienDecision update(EntretienDecision existing, EntretienDecisionRequestDTO dto) {
        existing.setTypeFaute(dto.getTypeFaute());
        existing.setDateEntretien(dto.getDateEntretien());
        existing.setDecision(dto.getDecision());
        existing.setJustification(dto.getJustification());
        existing.setSignatureSL(dto.getSignatureSL());
        existing.setSignatureQM(dto.getSignatureQM());
        existing.setSignatureSGL(dto.getSignatureSGL());
        return repo.save(existing);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}