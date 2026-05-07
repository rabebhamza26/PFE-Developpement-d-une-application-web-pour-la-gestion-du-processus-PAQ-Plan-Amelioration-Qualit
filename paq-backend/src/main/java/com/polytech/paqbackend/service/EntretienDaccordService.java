package com.polytech.paqbackend.service;

import com.polytech.paqbackend.controller.PaqController;
import com.polytech.paqbackend.dto.EntretienDaccordRequestDTO;
import com.polytech.paqbackend.entity.EntretienDaccord;
import com.polytech.paqbackend.entity.PaqDossier;
import com.polytech.paqbackend.repository.CollaboratorRepository;
import com.polytech.paqbackend.repository.EntretienDaccordRepository;
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
public class EntretienDaccordService {

    private static final Logger log = LoggerFactory.getLogger(EntretienDaccordService.class);

    private final EntretienDaccordRepository repo;
    private final PaqRepository paqRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final CollaboratorRepository collaboratorRepository;
    private final ObjectMapper objectMapper;

    public EntretienDaccordService(EntretienDaccordRepository repo,
                                   PaqRepository paqRepository,
                                   NotificationService notificationService,
                                   EmailService emailService,
                                   CollaboratorRepository collaboratorRepository) {
        this.repo = repo;
        this.paqRepository = paqRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.collaboratorRepository = collaboratorRepository;
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

    public EntretienDaccord createAvecNotification(String matricule,
                                                   EntretienDaccordRequestDTO dto,
                                                   String expediteurEmail) {
        EntretienDaccord saved = create(matricule, dto, expediteurEmail);

        String nomCollab = getCollaborateurNom(matricule);
        String destinataireEmail = dto.getDestinataireEmail();

        if (destinataireEmail != null && !destinataireEmail.isBlank()) {
            envoyerEmailValidation(expediteurEmail, destinataireEmail, nomCollab, matricule, dto, "créé");
            notificationService.envoyerNotification(
                    expediteurEmail,
                    "📧 Email envoyé",
                    "Un email concernant l'entretien d'accord de " + nomCollab + " a été envoyé à " + destinataireEmail,
                    "SUCCESS", matricule, "ACCORD"
            );
        } else {
            log.warn("Aucun email destinataire fourni pour l'entretien d'accord de {}", matricule);
        }

        return saved;
    }

    public EntretienDaccord updateAvecNotification(Long id,
                                                   String matricule,
                                                   EntretienDaccordRequestDTO dto,
                                                   String expediteurEmail) {
        EntretienDaccord updated = updateWithPaqUpdate(id, matricule, dto);

        String nomCollab = getCollaborateurNom(matricule);
        String destinataireEmail = dto.getDestinataireEmail();

        if (destinataireEmail != null && !destinataireEmail.isBlank()) {
            envoyerEmailValidation(expediteurEmail, destinataireEmail, nomCollab, matricule, dto, "modifié");
            notificationService.envoyerNotification(
                    expediteurEmail,
                    "📧 Email envoyé",
                    "Un email concernant la modification de l'entretien d'accord de " + nomCollab + " a été envoyé à " + destinataireEmail,
                    "SUCCESS", matricule, "ACCORD"
            );
        }

        return updated;
    }

    public void deleteAvecNotification(Long id, String matricule, String expediteurEmail, String destinataireEmail, String nomCollab) {
        EntretienDaccord entretien = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entretien introuvable: " + id));

        repo.deleteById(id);

        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();

            String historique = addHistorique(
                    paq.getHistorique(),
                    new PaqController.HistoriqueEvent(
                            LocalDate.now(),
                            " SUPPRESSION ENTRETIEN D'ACCORD",
                            String.format("Entretien d'accord supprimé le %s", LocalDate.now())
                    )
            );
            paq.setHistorique(historique);
            paqRepository.save(paq);
        }

        if (destinataireEmail != null && !destinataireEmail.isBlank()) {
            envoyerEmailSuppression(expediteurEmail, destinataireEmail, nomCollab, matricule);
        }

        log.info("Entretien d'accord {} supprimé pour {}", id, matricule);
    }

    public EntretienDaccord create(String matricule, EntretienDaccordRequestDTO dto, String expediteurEmail) {
        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);

        if (paqOpt.isEmpty()) {
            throw new RuntimeException("Aucun dossier PAQ actif trouvé pour le matricule : " + matricule);
        }

        PaqDossier paq = paqOpt.get();

        // Permettre l'entretien d'accord si niveau 1 ou 2 (modification)
        if (paq.getNiveau() < 1 || paq.getNiveau() > 2) {
            throw new RuntimeException("Le niveau actuel (" + paq.getNiveau() + ") ne permet pas l'entretien d'accord (niveau 1 ou 2 requis)");
        }

        EntretienDaccord e = new EntretienDaccord();
        e.setMatricule(matricule);
        e.setDate(dto.getDate() != null ? dto.getDate() : LocalDate.now());
        e.setTypeFaute(dto.getTypeFaute());
        e.setValidationMesures(dto.getValidationMesures() != null ? dto.getValidationMesures() : "Non");
        e.setMesuresProposees(dto.getMesuresProposees() != null ? dto.getMesuresProposees() : "");
        e.setCommentaireQMSegment(dto.getCommentaireQMSegment() != null ? dto.getCommentaireQMSegment() : "");
        e.setEchanges(dto.getEchanges() != null ? dto.getEchanges() : "");

        EntretienDaccord saved = repo.save(e);

        // Ne mettre à jour le niveau que si c'est un nouvel entretien (niveau 1)
        if (paq.getNiveau() == 1) {
            LocalDate dateReelle = e.getDate();
            paq.setNiveau(2);
            paq.setDateDeuxiemeEntretien(dateReelle);
        }

        paq.setDeuxiemeEntretienNotes(dto.getMesuresProposees());

        String historique = addHistorique(paq.getHistorique(),
                new PaqController.HistoriqueEvent(e.getDate(),
                        " ENTRETIEN D'ACCORD",
                        String.format("Entretien d'accord %s le %s — Faute : %s — Validation : %s",
                                saved.getId() != null ? "validé" : "modifié",
                                e.getDate(), dto.getTypeFaute(),
                                "Oui".equals(dto.getValidationMesures()) ? "Validé" : "Non validé"))
        );
        paq.setHistorique(historique);
        paqRepository.save(paq);

        return saved;
    }

    public EntretienDaccord updateWithPaqUpdate(Long id, String matricule, EntretienDaccordRequestDTO dto) {
        EntretienDaccord existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entretien introuvable: " + id));

        if (dto.getDate() != null) existing.setDate(dto.getDate());
        if (dto.getTypeFaute() != null) existing.setTypeFaute(dto.getTypeFaute());
        if (dto.getValidationMesures() != null) existing.setValidationMesures(dto.getValidationMesures());
        if (dto.getMesuresProposees() != null) existing.setMesuresProposees(dto.getMesuresProposees());
        if (dto.getCommentaireQMSegment() != null) existing.setCommentaireQMSegment(dto.getCommentaireQMSegment());
        if (dto.getEchanges() != null) existing.setEchanges(dto.getEchanges());

        EntretienDaccord updated = repo.save(existing);

        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();
            paq.setDeuxiemeEntretienNotes(dto.getMesuresProposees());

            String historique = addHistorique(
                    paq.getHistorique(),
                    new PaqController.HistoriqueEvent(
                            LocalDate.now(),
                            " MODIFICATION ENTRETIEN D'ACCORD",
                            String.format("Entretien d'accord modifié le %s", LocalDate.now())
                    )
            );
            paq.setHistorique(historique);
            paqRepository.save(paq);
        }

        return updated;
    }

    public EntretienDaccord findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Entretien introuvable id=" + id));
    }

    public List<EntretienDaccord> findByMatricule(String matricule) {
        return repo.findByMatricule(matricule);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }

    private String getCollaborateurNom(String matricule) {
        try {
            return collaboratorRepository.findByMatricule(matricule)
                    .map(c -> c.getName() + " " + c.getPrenom())
                    .orElse(matricule);
        } catch (Exception e) {
            return matricule;
        }
    }

    private void envoyerEmailValidation(String expediteur, String destinataire,
                                        String nomCollab, String matricule,
                                        EntretienDaccordRequestDTO dto, String action) {
        try {
            String sujet = String.format("[PAQ] Entretien d'accord %s - %s", action, nomCollab);
            String htmlContent = buildEmailContent(nomCollab, matricule, dto, action);
            emailService.sendEmail(expediteur, destinataire, sujet, htmlContent);
            log.info("Email envoyé à {} pour l'entretien d'accord {} de {}", destinataire, action, matricule);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email à {}: {}", destinataire, e.getMessage());
        }
    }

    private void envoyerEmailSuppression(String expediteur, String destinataire,
                                         String nomCollab, String matricule) {
        try {
            String sujet = String.format("[PAQ] Entretien d'accord supprimé - %s", nomCollab);
            String htmlContent = buildEmailSuppressionContent(nomCollab, matricule);
            emailService.sendEmail(expediteur, destinataire, sujet, htmlContent);
            log.info("Email de suppression envoyé à {} pour {}", destinataire, matricule);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de suppression à {}: {}", destinataire, e.getMessage());
        }
    }

    private String buildEmailContent(String nomCollab, String matricule,
                                     EntretienDaccordRequestDTO dto, String action) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif;">
              <div style="max-width:600px;margin:auto;background:white;border-radius:8px;padding:20px;">
                <div style="background:#C8102E;padding:15px;border-radius:8px 8px 0 0;margin:-20px -20px 0 -20px;">
                  <h2 style="color:white;margin:0;">🏭 PAQ - Entretien d'accord %s</h2>
                </div>
                <div style="padding:20px 0;">
                  <p>Bonjour,</p>
                  <p>Un entretien d'accord a été <strong>%s</strong> pour le collaborateur :</p>
                  <table style="width:100%%;border-collapse:collapse;margin:20px 0;">
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Collaborateur</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Matricule</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Type de faute</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Date</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Mesures proposées</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Validation QM-Segment</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Commentaires QM-Segment</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                   </table>
                  <p>Veuillez vous connecter au système PAQ pour plus de détails.</p>
                </div>
              </div>
            </body>
            </html>
            """, action.equals("créé") ? "Validé" : "Modifié",
                action, nomCollab, matricule, dto.getTypeFaute(), dto.getDate(),
                dto.getMesuresProposees(), dto.getValidationMesures(), dto.getCommentaireQMSegment());
    }

    private String buildEmailSuppressionContent(String nomCollab, String matricule) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif;">
              <div style="max-width:600px;margin:auto;background:white;border-radius:8px;padding:20px;">
                <div style="background:#C8102E;padding:15px;border-radius:8px 8px 0 0;margin:-20px -20px 0 -20px;">
                  <h2 style="color:white;margin:0;">🏭 PAQ - Suppression d'entretien d'accord</h2>
                </div>
                <div style="padding:20px 0;">
                  <p>Bonjour,</p>
                  <p>L'entretien d'accord pour le collaborateur suivant a été supprimé :</p>
                  <table style="width:100%%;border-collapse:collapse;margin:20px 0;">
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Collaborateur</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Matricule</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                    </table>
                    <p style="color: #C8102E;">L'entretien a été supprimé du système.</p>
                </div>
              </div>
            </body>
            </html>
            """, nomCollab, matricule);
    }
}