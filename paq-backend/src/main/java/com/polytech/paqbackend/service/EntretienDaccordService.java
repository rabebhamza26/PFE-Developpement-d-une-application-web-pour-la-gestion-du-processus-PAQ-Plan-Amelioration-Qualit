package com.polytech.paqbackend.service;

import com.polytech.paqbackend.controller.PaqController;
import com.polytech.paqbackend.dto.EntretienDaccordRequestDTO;
import com.polytech.paqbackend.entity.EntretienDaccord;
import com.polytech.paqbackend.entity.PaqDossier;
import com.polytech.paqbackend.repository.EntretienDaccordRepository;
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
public class EntretienDaccordService {

    private static final Logger log = LoggerFactory.getLogger(EntretienDaccordService.class);

    private final EntretienDaccordRepository repo;
    private final PaqRepository paqRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    public EntretienDaccordService(EntretienDaccordRepository repo,
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

    public EntretienDaccord create(String matricule, EntretienDaccordRequestDTO dto, String expediteurEmail) {

        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);

        if (paqOpt.isEmpty()) {
            throw new RuntimeException("Aucun dossier PAQ actif trouvé pour le matricule : " + matricule);
        }

        PaqDossier paq = paqOpt.get();

        if (paq.getNiveau() != 1) {
            throw new RuntimeException("Le niveau actuel (" + paq.getNiveau() + ") ne permet pas l'entretien d'accord (niveau 1 requis)");
        }

        // Création Entretien
        EntretienDaccord e = new EntretienDaccord();
        e.setMatricule(matricule);
        e.setDate(dto.getDate() != null ? dto.getDate() : LocalDate.now());
        e.setTypeFaute(dto.getTypeFaute());
        e.setValidationMesures(dto.getValidationMesures() != null ? dto.getValidationMesures() : "Non");
        e.setMesuresProposees(dto.getMesuresProposees() != null ? dto.getMesuresProposees() : "");
        e.setCommentaireQMSegment(dto.getCommentaireQMSegment() != null ? dto.getCommentaireQMSegment() : "");
        e.setEchanges(dto.getEchanges() != null ? dto.getEchanges() : "");
        e.setSignatureSL(dto.getSignatureSL() != null ? dto.getSignatureSL() : "");
        e.setSignatureQMSegment(dto.getSignatureQMSegment() != null ? dto.getSignatureQMSegment() : "");

        EntretienDaccord saved = repo.save(e);

        // MAJ PAQ → niveau 2
        LocalDate dateReelle = e.getDate();
        paq.setNiveau(2);
        paq.setDateDeuxiemeEntretien(dateReelle);
        paq.setDeuxiemeEntretienNotes(dto.getMesuresProposees());

        String historique = addHistorique(paq.getHistorique(),
                new PaqController.HistoriqueEvent(dateReelle,
                        " ENTRETIEN D'ACCORD",
                        String.format("Entretien d'accord validé le %s — Faute : %s — Validation : %s",
                                dateReelle, dto.getTypeFaute(),
                                "Oui".equals(dto.getValidationMesures()) ? "Validé" : "Non validé"))
        );
        paq.setHistorique(historique);
        paqRepository.save(paq);

        // Envoi email si destinataire fourni
        if (dto.getDestinataireEmail() != null && !dto.getDestinataireEmail().isBlank()) {
            try {
                String sujet = "[PAQ] Entretien d'accord validé - " + getCollaborateurNom(matricule);
                String html = buildEmailContent(matricule, dto);
                emailService.sendEmail(expediteurEmail, dto.getDestinataireEmail(), sujet, html);
                log.info("Email envoyé à {} pour l'entretien d'accord de {}", dto.getDestinataireEmail(), matricule);
            } catch (Exception ex) {
                log.error("Erreur envoi email: {}", ex.getMessage());
            }
        }

        return saved;
    }

    private String buildEmailContent(String matricule, EntretienDaccordRequestDTO dto) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif;">
              <div style="max-width:600px;margin:auto;background:white;border-radius:8px;padding:20px;">
                <div style="background:#C8102E;padding:15px;border-radius:8px 8px 0 0;margin:-20px -20px 0 -20px;">
                  <h2 style="color:white;margin:0;">🏭 PAQ - Entretien d'accord validé</h2>
                </div>
                <div style="padding:20px 0;">
                  <p>Bonjour,</p>
                  <p>Un entretien d'accord a été validé pour le matricule <strong>%s</strong>.</p>
                  <table style="width:100%%;border-collapse:collapse;margin:20px 0;">
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Type de faute</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Date</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Mesures proposées</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Validation QM</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                  </table>
                  <p>Veuillez vous connecter au système PAQ pour plus de détails.</p>
                </div>
              </div>
            </body>
            </html>
            """, matricule, dto.getTypeFaute(), dto.getDate(),
                dto.getMesuresProposees(), dto.getValidationMesures());
    }

    private String getCollaborateurNom(String matricule) {
        return matricule; // À implémenter selon votre besoin
    }

    public EntretienDaccord findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Entretien introuvable id=" + id));
    }

    public List<EntretienDaccord> findByMatricule(String matricule) {
        return repo.findByMatricule(matricule);
    }

    public EntretienDaccord update(EntretienDaccord existing, EntretienDaccordRequestDTO dto) {
        if (dto.getDate() != null) existing.setDate(dto.getDate());
        if (dto.getTypeFaute() != null) existing.setTypeFaute(dto.getTypeFaute());
        if (dto.getValidationMesures() != null) existing.setValidationMesures(dto.getValidationMesures());
        if (dto.getMesuresProposees() != null) existing.setMesuresProposees(dto.getMesuresProposees());
        if (dto.getCommentaireQMSegment() != null) existing.setCommentaireQMSegment(dto.getCommentaireQMSegment());
        if (dto.getEchanges() != null) existing.setEchanges(dto.getEchanges());
        if (dto.getSignatureSL() != null) existing.setSignatureSL(dto.getSignatureSL());
        if (dto.getSignatureQMSegment() != null) existing.setSignatureQMSegment(dto.getSignatureQMSegment());
        return repo.save(existing);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}