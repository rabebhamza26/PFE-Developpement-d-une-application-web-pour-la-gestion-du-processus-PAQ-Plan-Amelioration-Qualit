package com.polytech.paqbackend.service;

import com.polytech.paqbackend.controller.PaqController;
import com.polytech.paqbackend.dto.EntretienMesureRequestDTO;
import com.polytech.paqbackend.entity.EntretienMesure;
import com.polytech.paqbackend.entity.PaqDossier;
import com.polytech.paqbackend.repository.CollaboratorRepository;
import com.polytech.paqbackend.repository.EntretienMesureRepository;
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
public class EntretienMesureService {

    private static final Logger log = LoggerFactory.getLogger(EntretienMesureService.class);

    private final EntretienMesureRepository repo;
    private final PaqRepository paqRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final CollaboratorRepository collaboratorRepository;
    private final ObjectMapper objectMapper;

    public EntretienMesureService(EntretienMesureRepository repo,
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

    public EntretienMesure createAvecNotification(String matricule,
                                                  EntretienMesureRequestDTO dto,
                                                  String expediteurEmail) {
        EntretienMesure saved = create(matricule, dto, expediteurEmail);

        String nomCollab = getCollaborateurNom(matricule);
        String destinataireEmail = dto.getDestinataireEmail();

        if (destinataireEmail != null && !destinataireEmail.isBlank()) {
            envoyerEmailValidation(expediteurEmail, destinataireEmail, nomCollab, matricule, dto, "créé");
            notificationService.envoyerNotification(
                    expediteurEmail,
                    "📧 Email envoyé",
                    "Un email concernant l'entretien de mesure de " + nomCollab + " a été envoyé à " + destinataireEmail,
                    "SUCCESS", matricule, "MESURE"
            );
        } else {
            log.warn("Aucun email destinataire fourni pour l'entretien de mesure de {}", matricule);
        }

        return saved;
    }

    public EntretienMesure updateAvecNotification(Long id,
                                                  String matricule,
                                                  EntretienMesureRequestDTO dto,
                                                  String expediteurEmail) {
        EntretienMesure updated = updateWithPaqUpdate(id, matricule, dto);

        String nomCollab = getCollaborateurNom(matricule);
        String destinataireEmail = dto.getDestinataireEmail();

        if (destinataireEmail != null && !destinataireEmail.isBlank()) {
            envoyerEmailValidation(expediteurEmail, destinataireEmail, nomCollab, matricule, dto, "modifié");
            notificationService.envoyerNotification(
                    expediteurEmail,
                    "📧 Email envoyé",
                    "Un email concernant la modification de l'entretien de mesure de " + nomCollab + " a été envoyé à " + destinataireEmail,
                    "SUCCESS", matricule, "MESURE"
            );
        }

        return updated;
    }

    public void deleteAvecNotification(Long id, String matricule, String expediteurEmail, String destinataireEmail, String nomCollab) {
        EntretienMesure entretien = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entretien introuvable: " + id));

        repo.deleteById(id);

        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();

            String historique = addHistorique(
                    paq.getHistorique(),
                    new PaqController.HistoriqueEvent(
                            LocalDate.now(),
                            " SUPPRESSION ENTRETIEN DE MESURE",
                            String.format("Entretien de mesure supprimé le %s", LocalDate.now())
                    )
            );
            paq.setHistorique(historique);
            paqRepository.save(paq);
        }

        if (destinataireEmail != null && !destinataireEmail.isBlank()) {
            envoyerEmailSuppression(expediteurEmail, destinataireEmail, nomCollab, matricule);
        }

        log.info("Entretien de mesure {} supprimé pour {}", id, matricule);
    }

    public EntretienMesure create(String matricule, EntretienMesureRequestDTO dto, String expediteurEmail) {
        LocalDate dateEntretien = dto.getDateEntretien() != null ? dto.getDateEntretien() : LocalDate.now();
        validateDates(dateEntretien, dto.getDateRequalification());

        EntretienMesure e = new EntretienMesure();
        e.setMatricule(matricule);
        e.setTypeFaute(dto.getTypeFaute());
        e.setCausesPrincipales(dto.getCausesPrincipales());
        e.setConvention(dto.getConvention());
        e.setPlanAction(dto.getPlanAction());
        e.setDateEntretien(dateEntretien);
        e.setDateRequalification(dto.getDateRequalification());
        e.setDateCreation(LocalDate.now());

        EntretienMesure saved = repo.save(e);

        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);

        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();

            if (paq.getNiveau() < 2 || paq.getNiveau() > 3) {
                throw new RuntimeException("Le niveau actuel (" + paq.getNiveau() + ") ne permet pas l'entretien de mesure (niveau 2 ou 3 requis)");
            }

            if (paq.getNiveau() == 2) {
                paq.setNiveau(3);
                paq.setDateTroisiemeEntretien(dateEntretien);
            }

            String notes = "Type faute: " + dto.getTypeFaute()
                    + " | Plan action: " + (dto.getPlanAction() != null ? dto.getPlanAction() : "")
                    + " | Convention: " + (dto.getConvention() != null ? dto.getConvention() : "");
            paq.setTroisiemeEntretienNotes(notes);

            String historique = addHistorique(paq.getHistorique(),
                    new PaqController.HistoriqueEvent(dateEntretien, " ENTRETIEN DE MESURE",
                            String.format("Entretien de mesure %s le %s — Requalification prévue le %s",
                                    saved.getId() != null ? "validé" : "modifié",
                                    dateEntretien, dto.getDateRequalification())));
            paq.setHistorique(historique);
            paqRepository.save(paq);
            log.info("PAQ mis à jour pour le matricule {}", matricule);
        }

        return saved;
    }

    public EntretienMesure updateWithPaqUpdate(Long id, String matricule, EntretienMesureRequestDTO dto) {
        EntretienMesure existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entretien introuvable: " + id));

        validateDates(dto.getDateEntretien(), dto.getDateRequalification());

        existing.setTypeFaute(dto.getTypeFaute());
        existing.setCausesPrincipales(dto.getCausesPrincipales());
        existing.setConvention(dto.getConvention());
        existing.setPlanAction(dto.getPlanAction());
        existing.setDateEntretien(dto.getDateEntretien());
        existing.setDateRequalification(dto.getDateRequalification());

        EntretienMesure updated = repo.save(existing);

        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();

            String notes = "Type faute: " + dto.getTypeFaute()
                    + " | Plan action: " + (dto.getPlanAction() != null ? dto.getPlanAction() : "")
                    + " | Convention: " + (dto.getConvention() != null ? dto.getConvention() : "");
            paq.setTroisiemeEntretienNotes(notes);

            String historique = addHistorique(
                    paq.getHistorique(),
                    new PaqController.HistoriqueEvent(
                            LocalDate.now(),
                            " MODIFICATION ENTRETIEN DE MESURE",
                            String.format("Entretien de mesure modifié le %s", LocalDate.now())
                    )
            );
            paq.setHistorique(historique);
            paqRepository.save(paq);
        }

        return updated;
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
                                        EntretienMesureRequestDTO dto, String action) {
        try {
            String sujet = String.format("[PAQ] Entretien de mesure %s - %s", action, nomCollab);
            String htmlContent = buildEmailContent(nomCollab, matricule, dto, action);
            emailService.sendEmail(expediteur, destinataire, sujet, htmlContent);
            log.info("Email envoyé à {} pour l'entretien de mesure {} de {}", destinataire, action, matricule);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email à {}: {}", destinataire, e.getMessage());
        }
    }

    private void envoyerEmailSuppression(String expediteur, String destinataire,
                                         String nomCollab, String matricule) {
        try {
            String sujet = String.format("[PAQ] Entretien de mesure supprimé - %s", nomCollab);
            String htmlContent = buildEmailSuppressionContent(nomCollab, matricule);
            emailService.sendEmail(expediteur, destinataire, sujet, htmlContent);
            log.info("Email de suppression envoyé à {} pour {}", destinataire, matricule);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de suppression à {}: {}", destinataire, e.getMessage());
        }
    }

    private String buildEmailContent(String nomCollab, String matricule,
                                     EntretienMesureRequestDTO dto, String action) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif;">
              <div style="max-width:600px;margin:auto;background:white;border-radius:8px;padding:20px;">
                <div style="background:#C8102E;padding:15px;border-radius:8px 8px 0 0;margin:-20px -20px 0 -20px;">
                  <h2 style="color:white;margin:0;">🏭 PAQ - Entretien de mesure %s</h2>
                </div>
                <div style="padding:20px 0;">
                  <p>Bonjour,</p>
                  <p>Un entretien de mesure a été <strong>%s</strong> pour le collaborateur :</p>
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
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Date requalification</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Causes principales</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Convention</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Plan d'action</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                  </table>
                  <p>Veuillez vous connecter au système PAQ pour plus de détails.</p>
                </div>
              </div>
            </body>
            </html>
            """, action.equals("créé") ? "Validé" : "Modifié",
                action, nomCollab, matricule, dto.getTypeFaute(),
                dto.getDateEntretien(), dto.getDateRequalification(),
                dto.getCausesPrincipales(), dto.getConvention(), dto.getPlanAction());
    }

    private String buildEmailSuppressionContent(String nomCollab, String matricule) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif;">
              <div style="max-width:600px;margin:auto;background:white;border-radius:8px;padding:20px;">
                <div style="background:#C8102E;padding:15px;border-radius:8px 8px 0 0;margin:-20px -20px 0 -20px;">
                  <h2 style="color:white;margin:0;">🏭 PAQ - Suppression d'entretien de mesure</h2>
                </div>
                <div style="padding:20px 0;">
                  <p>Bonjour,</p>
                  <p>L'entretien de mesure pour le collaborateur suivant a été supprimé :</p>
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