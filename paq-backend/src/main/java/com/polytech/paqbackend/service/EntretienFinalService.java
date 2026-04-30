package com.polytech.paqbackend.service;

import com.polytech.paqbackend.controller.PaqController;
import com.polytech.paqbackend.dto.EntretienFinalDTO;
import com.polytech.paqbackend.entity.EntretienFinal;
import com.polytech.paqbackend.entity.PaqDossier;
import com.polytech.paqbackend.repository.EntretienFinalRepository;
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
public class EntretienFinalService {

    private static final Logger log = LoggerFactory.getLogger(EntretienFinalService.class);

    private final EntretienFinalRepository entretienFinalRepository;
    private final PaqRepository paqRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    public EntretienFinalService(EntretienFinalRepository entretienFinalRepository,
                                 PaqRepository paqRepository,
                                 NotificationService notificationService,
                                 EmailService emailService) {
        this.entretienFinalRepository = entretienFinalRepository;
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

    public EntretienFinal createEntretienFinal(String matricule, EntretienFinalDTO dto, String expediteurEmail) {
        // Vérifier que le dossier existe
        PaqDossier dossier = paqRepository
                .findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule)
                .orElseThrow(() -> new RuntimeException("Dossier PAQ actif non trouvé pour le matricule : " + matricule));

        EntretienFinal entretien = new EntretienFinal();
        entretien.setMatricule(matricule);
        entretien.setDecision(dto.getDecision());
        entretien.setDateEntretien(dto.getDateEntretien());
        entretien.setTypeFaute(dto.getTypeFaute());
        entretien.setCommentaireRH(dto.getCommentaireRH());
        entretien.setSignatureBase64(dto.getSignatureBase64());

        EntretienFinal saved = entretienFinalRepository.save(entretien);

        // MAJ PAQ
        LocalDate dateReelle = dto.getDateEntretien() != null ? dto.getDateEntretien() : LocalDate.now();
        dossier.setDateCinquiemeEntretien(dateReelle);
        dossier.setCinquiemeEntretienNotes(dto.getCommentaireRH() != null ? dto.getCommentaireRH() : "");
        dossier.setNiveau(5);
        dossier.setStatut("CLOTURE");

        String historique = addHistorique(dossier.getHistorique(),
                new PaqController.HistoriqueEvent(dateReelle, "Entretien Final",
                        String.format("Entretien final réalisé le %s — Décision : %s — Faute : %s",
                                dateReelle, dto.getDecision(), dto.getTypeFaute())));
        dossier.setHistorique(historique);
        paqRepository.save(dossier);

        // Envoi email si destinataire fourni
        if (dto.getDestinataireEmail() != null && !dto.getDestinataireEmail().isBlank()) {
            try {
                String sujet = "[PAQ] Entretien final validé - Clôture du dossier - " + matricule;
                String html = buildEmailContent(matricule, dto);
                emailService.sendEmail(expediteurEmail, dto.getDestinataireEmail(), sujet, html);
                log.info("Email envoyé à {} pour l'entretien final de {}", dto.getDestinataireEmail(), matricule);
            } catch (Exception ex) {
                log.error("Erreur envoi email: {}", ex.getMessage());
            }
        }

        return saved;
    }

    private String buildEmailContent(String matricule, EntretienFinalDTO dto) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif;">
              <div style="max-width:600px;margin:auto;background:white;border-radius:8px;padding:20px;">
                <div style="background:#C8102E;padding:15px;border-radius:8px 8px 0 0;margin:-20px -20px 0 -20px;">
                  <h2 style="color:white;margin:0;">🏭 PAQ - Entretien final validé - Dossier clôturé</h2>
                </div>
                <div style="padding:20px 0;">
                  <p>Bonjour,</p>
                  <p>L'entretien final a été validé pour le matricule <strong>%s</strong>.</p>
                  <table style="width:100%%;border-collapse:collapse;margin:20px 0;">
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Type de faute</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td</tr>
                    <tr>
                        <td style="padding:8px;border:1px solid #ddd;"><strong>Date entretien</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td</tr>
                    <tr>
                        <td style="padding:8px;border:1px solid #ddd;"><strong>Décision RH</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td</tr>
                    <tr>
                        <td style="padding:8px;border:1px solid #ddd;"><strong>Commentaire RH</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td</tr>
                   </table>
                  <p>Le dossier PAQ est désormais <strong>CLÔTURÉ</strong>.</p>
                </div>
              </div>
            </body>
            </html>
            """, matricule, dto.getTypeFaute(), dto.getDateEntretien(),
                dto.getDecision(), dto.getCommentaireRH() != null ? dto.getCommentaireRH() : "");
    }

    public List<EntretienFinal> getByMatricule(String matricule) {
        return entretienFinalRepository.findByMatricule(matricule);
    }

    public void delete(Long id) {
        entretienFinalRepository.deleteById(id);
    }
}