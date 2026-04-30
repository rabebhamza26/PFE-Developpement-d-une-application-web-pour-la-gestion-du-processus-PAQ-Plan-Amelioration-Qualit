package com.polytech.paqbackend.service;

import com.polytech.paqbackend.controller.PaqController;
import com.polytech.paqbackend.dto.EntretienMesureRequestDTO;
import com.polytech.paqbackend.entity.EntretienMesure;
import com.polytech.paqbackend.entity.PaqDossier;
import com.polytech.paqbackend.repository.EntretienMesureRepository;
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
public class EntretienMesureService {

    private static final Logger log = LoggerFactory.getLogger(EntretienMesureService.class);

    private final EntretienMesureRepository repo;
    private final PaqRepository paqRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    public EntretienMesureService(EntretienMesureRepository repo,
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

    public EntretienMesure create(String matricule, EntretienMesureRequestDTO dto, String expediteurEmail) {

        LocalDate dateEntretien = dto.getDateEntretien() != null ? dto.getDateEntretien() : LocalDate.now();

        validateDates(dateEntretien, dto.getDateRequalification());

        // ── Créer l'entretien ─────────────────────────────────────────────
        EntretienMesure e = new EntretienMesure();
        e.setMatricule(matricule);
        e.setTypeFaute(dto.getTypeFaute());
        e.setCausesPrincipales(dto.getCausesPrincipales());
        e.setConvention(dto.getConvention());
        e.setPlanAction(dto.getPlanAction());
        e.setDateEntretien(dateEntretien);
        e.setDateRequalification(dto.getDateRequalification());
        e.setSignatureSL(dto.getSignatureSL());
        e.setSignatureQMSegment(dto.getSignatureQMSegment());
        e.setSignatureSGL(dto.getSignatureSGL());
        e.setDateCreation(LocalDate.now());

        EntretienMesure saved = repo.save(e);

        // ── Mettre à jour le PAQ : niveau 3 ──────────────────────────────
        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);

        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();

            if (paq.getNiveau() != 2) {
                throw new RuntimeException("Le niveau actuel (" + paq.getNiveau() + ") ne permet pas l'entretien de mesure (niveau 2 requis)");
            }

            paq.setNiveau(3);
            paq.setDateTroisiemeEntretien(dateEntretien);

            String notes = "Type faute: " + dto.getTypeFaute()
                    + " | Plan action: " + (dto.getPlanAction() != null ? dto.getPlanAction() : "")
                    + " | Convention: " + (dto.getConvention() != null ? dto.getConvention() : "");
            paq.setTroisiemeEntretienNotes(notes);

            String historique = addHistorique(paq.getHistorique(),
                    new PaqController.HistoriqueEvent(dateEntretien, "Entretien De Mesure",
                            "Entretien de mesure validé le " + dateEntretien + " — Requalification prévue le " + dto.getDateRequalification()));
            paq.setHistorique(historique);
            paqRepository.save(paq);
            log.info("PAQ mis à niveau 3 pour le matricule {}", matricule);
        }

        // ── Envoi email si destinataire fourni ───────────────────────────
        if (dto.getDestinataireEmail() != null && !dto.getDestinataireEmail().isBlank()) {
            try {
                String sujet = "[PAQ] Entretien de mesure validé - " + matricule;
                String html = buildEmailContent(matricule, dto);
                emailService.sendEmail(expediteurEmail, dto.getDestinataireEmail(), sujet, html);
                log.info("Email envoyé à {} pour l'entretien de mesure de {}", dto.getDestinataireEmail(), matricule);
            } catch (Exception ex) {
                log.error("Erreur envoi email: {}", ex.getMessage());
            }
        }

        return saved;
    }

    private String buildEmailContent(String matricule, EntretienMesureRequestDTO dto) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif;">
              <div style="max-width:600px;margin:auto;background:white;border-radius:8px;padding:20px;">
                <div style="background:#C8102E;padding:15px;border-radius:8px 8px 0 0;margin:-20px -20px 0 -20px;">
                  <h2 style="color:white;margin:0;">🏭 PAQ - Entretien de mesure validé</h2>
                </div>
                <div style="padding:20px 0;">
                  <p>Bonjour,</p>
                  <p>Un entretien de mesure a été validé pour le matricule <strong>%s</strong>.</p>
                  <table style="width:100%%;border-collapse:collapse;margin:20px 0;">
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Type de faute</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Date entretien</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Date requalification</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Causes principales</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Plan d'action</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                  </table>
                  <p>Veuillez vous connecter au système PAQ pour plus de détails.</p>
                </div>
              </div>
            </body>
            </html>
            """, matricule, dto.getTypeFaute(), dto.getDateEntretien(),
                dto.getDateRequalification(), dto.getCausesPrincipales(), dto.getPlanAction());
    }

    public EntretienMesure update(Long id, EntretienMesureRequestDTO dto) {
        EntretienMesure e = repo.findById(id).orElseThrow();
        validateDates(dto.getDateEntretien(), dto.getDateRequalification());
        e.setTypeFaute(dto.getTypeFaute());
        e.setCausesPrincipales(dto.getCausesPrincipales());
        e.setConvention(dto.getConvention());
        e.setPlanAction(dto.getPlanAction());
        e.setDateEntretien(dto.getDateEntretien());
        e.setDateRequalification(dto.getDateRequalification());
        e.setSignatureSL(dto.getSignatureSL());
        e.setSignatureQMSegment(dto.getSignatureQMSegment());
        e.setSignatureSGL(dto.getSignatureSGL());
        return repo.save(e);
    }

    public List<EntretienMesure> getByMatricule(String matricule) {
        return repo.findByMatricule(matricule);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }

    private void validateDates(LocalDate entretien, LocalDate requalification) {
        if (entretien == null) throw new RuntimeException("Date entretien obligatoire");
        if (requalification == null) throw new RuntimeException("Date de requalification obligatoire");
        if (requalification.isBefore(entretien)) throw new RuntimeException("La requalification ne peut pas être avant l'entretien");
        if (requalification.isAfter(entretien.plusDays(7))) throw new RuntimeException("La requalification doit être programmée au plus tard 7 jours après l'entretien");
    }
}