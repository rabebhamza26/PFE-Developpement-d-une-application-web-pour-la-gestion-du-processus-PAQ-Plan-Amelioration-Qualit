package com.polytech.paqbackend.service;

import com.polytech.paqbackend.controller.PaqController;
import com.polytech.paqbackend.dto.EntretienDecisionRequestDTO;
import com.polytech.paqbackend.entity.EntretienDecision;
import com.polytech.paqbackend.entity.PaqDossier;
import com.polytech.paqbackend.repository.CollaboratorRepository;
import com.polytech.paqbackend.repository.EntretienDecisionRepository;
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
public class EntretienDecisionService {

    private static final Logger log = LoggerFactory.getLogger(EntretienDecisionService.class);

    private final EntretienDecisionRepository repo;
    private final PaqRepository paqRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final CollaboratorRepository collaboratorRepository;
    private final ObjectMapper objectMapper;

    public EntretienDecisionService(EntretienDecisionRepository repo,
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

    public EntretienDecision createAvecNotification(String matricule,
                                                    EntretienDecisionRequestDTO dto,
                                                    String expediteurEmail) {
        EntretienDecision saved = create(matricule, dto, expediteurEmail);

        String nomCollab = getCollaborateurNom(matricule);
        String destinataireEmail = dto.getDestinataireEmail();

        if (destinataireEmail != null && !destinataireEmail.isBlank()) {
            envoyerEmailValidation(expediteurEmail, destinataireEmail, nomCollab, matricule, dto, "créé");
            notificationService.envoyerNotification(
                    expediteurEmail,
                    "📧 Email envoyé",
                    "Un email concernant l'entretien de décision de " + nomCollab + " a été envoyé à " + destinataireEmail,
                    "SUCCESS", matricule, "DECISION"
            );
        } else {
            log.warn("Aucun email destinataire fourni pour l'entretien de décision de {}", matricule);
        }

        return saved;
    }

    public EntretienDecision updateAvecNotification(Long id,
                                                    String matricule,
                                                    EntretienDecisionRequestDTO dto,
                                                    String expediteurEmail) {
        EntretienDecision updated = updateWithPaqUpdate(id, matricule, dto);

        String nomCollab = getCollaborateurNom(matricule);
        String destinataireEmail = dto.getDestinataireEmail();

        if (destinataireEmail != null && !destinataireEmail.isBlank()) {
            envoyerEmailValidation(expediteurEmail, destinataireEmail, nomCollab, matricule, dto, "modifié");
            notificationService.envoyerNotification(
                    expediteurEmail,
                    "📧 Email envoyé",
                    "Un email concernant la modification de l'entretien de décision de " + nomCollab + " a été envoyé à " + destinataireEmail,
                    "SUCCESS", matricule, "DECISION"
            );
        }

        return updated;
    }

    public void deleteAvecNotification(Long id, String matricule, String expediteurEmail, String destinataireEmail, String nomCollab) {
        EntretienDecision entretien = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entretien introuvable: " + id));

        repo.deleteById(id);

        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();

            String historique = addHistorique(
                    paq.getHistorique(),
                    new PaqController.HistoriqueEvent(
                            LocalDate.now(),
                            " SUPPRESSION ENTRETIEN DE DÉCISION",
                            String.format("Entretien de décision supprimé le %s", LocalDate.now())
                    )
            );
            paq.setHistorique(historique);
            paqRepository.save(paq);
        }

        if (destinataireEmail != null && !destinataireEmail.isBlank()) {
            envoyerEmailSuppression(expediteurEmail, destinataireEmail, nomCollab, matricule);
        }

        log.info("Entretien de décision {} supprimé pour {}", id, matricule);
    }

    public EntretienDecision create(String matricule, EntretienDecisionRequestDTO dto, String expediteurEmail) {
        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);

        if (paqOpt.isEmpty()) {
            throw new RuntimeException("Aucun dossier PAQ actif trouvé pour le matricule : " + matricule);
        }

        PaqDossier paq = paqOpt.get();

        // Permettre l'entretien de décision si niveau 3 ou 4 (modification)
        if (paq.getNiveau() < 3 || paq.getNiveau() > 4) {
            throw new RuntimeException("Le niveau actuel (" + paq.getNiveau() + ") ne permet pas l'entretien de décision (niveau 3 ou 4 requis)");
        }

        EntretienDecision entretien = new EntretienDecision();
        entretien.setMatricule(matricule);
        entretien.setTypeFaute(dto.getTypeFaute());
        entretien.setDateEntretien(dto.getDateEntretien() != null ? dto.getDateEntretien() : LocalDate.now());
        entretien.setDecision(dto.getDecision());
        entretien.setJustification(dto.getJustification());
        entretien.setDateCreation(LocalDate.now());

        EntretienDecision saved = repo.save(entretien);

        // Ne mettre à jour le niveau que si c'est un nouvel entretien (niveau 3)
        if (paq.getNiveau() == 3) {
            LocalDate dateReelle = entretien.getDateEntretien();
            paq.setNiveau(4);
            paq.setDateQuatriemeEntretien(dateReelle);
        }

        String notes = "Type faute: " + dto.getTypeFaute()
                + " | Décision: " + dto.getDecision()
                + " | Justification: " + (dto.getJustification() != null ? dto.getJustification() : "");
        paq.setQuatriemeEntretienNotes(notes);

        String historique = addHistorique(paq.getHistorique(),
                new PaqController.HistoriqueEvent(entretien.getDateEntretien(),
                        " ENTRETIEN DE DÉCISION",
                        "Entretien de décision " + (saved.getId() != null ? "validé" : "modifié") + " le " + entretien.getDateEntretien()
                                + " — Décision : " + dto.getDecision()
                                + " — Faute : " + dto.getTypeFaute()));
        paq.setHistorique(historique);
        paqRepository.save(paq);

        return saved;
    }

    public EntretienDecision updateWithPaqUpdate(Long id, String matricule, EntretienDecisionRequestDTO dto) {
        EntretienDecision existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entretien introuvable: " + id));

        existing.setTypeFaute(dto.getTypeFaute());
        existing.setDateEntretien(dto.getDateEntretien());
        existing.setDecision(dto.getDecision());
        existing.setJustification(dto.getJustification());

        EntretienDecision updated = repo.save(existing);

        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();

            String notes = "Type faute: " + dto.getTypeFaute()
                    + " | Décision: " + dto.getDecision()
                    + " | Justification: " + (dto.getJustification() != null ? dto.getJustification() : "");
            paq.setQuatriemeEntretienNotes(notes);

            String historique = addHistorique(
                    paq.getHistorique(),
                    new PaqController.HistoriqueEvent(
                            LocalDate.now(),
                            " MODIFICATION ENTRETIEN DE DÉCISION",
                            String.format("Entretien de décision modifié le %s", LocalDate.now())
                    )
            );
            paq.setHistorique(historique);
            paqRepository.save(paq);
        }

        return updated;
    }

    public EntretienDecision findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Entretien de décision introuvable id=" + id));
    }

    public List<EntretienDecision> findByMatricule(String matricule) {
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
                                        EntretienDecisionRequestDTO dto, String action) {
        try {
            String sujet = String.format("[PAQ] Entretien de décision %s - %s", action, nomCollab);
            String htmlContent = buildEmailContent(nomCollab, matricule, dto, action);
            emailService.sendEmail(expediteur, destinataire, sujet, htmlContent);
            log.info("Email envoyé à {} pour l'entretien de décision {} de {}", destinataire, action, matricule);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email à {}: {}", destinataire, e.getMessage());
        }
    }

    private void envoyerEmailSuppression(String expediteur, String destinataire,
                                         String nomCollab, String matricule) {
        try {
            String sujet = String.format("[PAQ] Entretien de décision supprimé - %s", nomCollab);
            String htmlContent = buildEmailSuppressionContent(nomCollab, matricule);
            emailService.sendEmail(expediteur, destinataire, sujet, htmlContent);
            log.info("Email de suppression envoyé à {} pour {}", destinataire, matricule);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de suppression à {}: {}", destinataire, e.getMessage());
        }
    }

    private String buildEmailContent(String nomCollab, String matricule,
                                     EntretienDecisionRequestDTO dto, String action) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif;">
              <div style="max-width:600px;margin:auto;background:white;border-radius:8px;padding:20px;">
                <div style="background:#C8102E;padding:15px;border-radius:8px 8px 0 0;margin:-20px -20px 0 -20px;">
                  <h2 style="color:white;margin:0;">🏭 PAQ - Entretien de décision %s</h2>
                </div>
                <div style="padding:20px 0;">
                  <p>Bonjour,</p>
                  <p>Un entretien de décision a été <strong>%s</strong> pour le collaborateur :</p>
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
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Date entretien</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Décision</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Justification</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                  </table>
                  <p>Veuillez vous connecter au système PAQ pour plus de détails.</p>
                </div>
              </div>
            </body>
            </html>
            """, action.equals("créé") ? "Validé" : "Modifié",
                action, nomCollab, matricule, dto.getTypeFaute(), dto.getDateEntretien(),
                dto.getDecision(), dto.getJustification());
    }

    private String buildEmailSuppressionContent(String nomCollab, String matricule) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif;">
              <div style="max-width:600px;margin:auto;background:white;border-radius:8px;padding:20px;">
                <div style="background:#C8102E;padding:15px;border-radius:8px 8px 0 0;margin:-20px -20px 0 -20px;">
                  <h2 style="color:white;margin:0;">🏭 PAQ - Suppression d'entretien de décision</h2>
                </div>
                <div style="padding:20px 0;">
                  <p>Bonjour,</p>
                  <p>L'entretien de décision pour le collaborateur suivant a été supprimé :</p>
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