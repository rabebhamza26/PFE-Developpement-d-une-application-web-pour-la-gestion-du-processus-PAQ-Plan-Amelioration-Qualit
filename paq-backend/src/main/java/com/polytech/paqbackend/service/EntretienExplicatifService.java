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
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final PaqRepository paqRepository;
    private final ObjectMapper objectMapper;

    public EntretienExplicatifService(EntretienExplicatifRepository entretienRepo,
                                      CollaboratorRepository collaborateurRepo,
                                      NotificationService notificationService,
                                      EmailService emailService,
                                      PaqRepository paqRepository) {
        this.entretienRepo = entretienRepo;
        this.collaborateurRepo = collaborateurRepo;
        this.notificationService = notificationService;
        this.emailService = emailService;
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

    public EntretienExplicatif createAvecNotification(String matricule,
                                                      EntretienExplicatifDTO dto,
                                                      int niveau,
                                                      String expediteurEmail) {
        EntretienExplicatif entretien = create(matricule, dto);

        String nomCollab = getCollaborateurNom(matricule);
        String destinataireEmail = dto.getDestinataireEmail();

        if (destinataireEmail != null && !destinataireEmail.isBlank()) {
            envoyerEmailValidation(expediteurEmail, destinataireEmail, nomCollab, niveau, matricule, dto, "créé");
            notificationService.envoyerNotification(
                    expediteurEmail,
                    "📧 Email envoyé",
                    "Un email concernant l'entretien de " + nomCollab + " a été envoyé à " + destinataireEmail,
                    "SUCCESS", matricule, getTypeEntretienString(niveau)
            );
        } else {
            log.warn("Aucun email destinataire fourni pour l'entretien de {}", matricule);
            notificationService.envoyerNotification(
                    expediteurEmail, "⚠️ Email non envoyé",
                    "Aucun email destinataire n'a été fourni pour l'entretien de " + nomCollab,
                    "WARNING", matricule, getTypeEntretienString(niveau)
            );
        }

        log.info("Entretien niveau {} créé pour {} - notifications envoyées", niveau, matricule);
        return entretien;
    }

    public EntretienExplicatif updateAvecNotification(Long id,
                                                      String matricule,
                                                      EntretienExplicatifDTO dto,
                                                      int niveau,
                                                      String expediteurEmail) {
        EntretienExplicatif entretien = updateWithPaqUpdate(id, matricule, dto);

        String nomCollab = getCollaborateurNom(matricule);
        String destinataireEmail = dto.getDestinataireEmail();

        if (destinataireEmail != null && !destinataireEmail.isBlank()) {
            envoyerEmailValidation(expediteurEmail, destinataireEmail, nomCollab, niveau, matricule, dto, "modifié");
            notificationService.envoyerNotification(
                    expediteurEmail,
                    "📧 Email envoyé",
                    "Un email concernant la modification de l'entretien de " + nomCollab + " a été envoyé à " + destinataireEmail,
                    "SUCCESS", matricule, getTypeEntretienString(niveau)
            );
        }

        log.info("Entretien niveau {} modifié pour {} - notifications envoyées", niveau, matricule);
        return entretien;
    }

    public void deleteAvecNotification(Long id, String matricule, String expediteurEmail, String destinataireEmail, String nomCollab) {
        // Récupérer l'entretien avant suppression pour les logs
        EntretienExplicatif entretien = entretienRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entretien introuvable: " + id));

        // Supprimer l'entretien
        entretienRepo.deleteById(id);

        // Mettre à jour le PAQ si nécessaire
        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();

            // Ajouter à l'historique
            String historique = addHistorique(
                    paq.getHistorique(),
                    new PaqController.HistoriqueEvent(
                            LocalDate.now(),
                            " SUPPRESSION ENTRETIEN EXPLICATIF",
                            String.format("Entretien explicatif supprimé le %s", LocalDate.now())
                    )
            );
            paq.setHistorique(historique);
            paqRepository.save(paq);
        }

        // Envoyer email de notification de suppression
        if (destinataireEmail != null && !destinataireEmail.isBlank()) {
            envoyerEmailSuppression(expediteurEmail, destinataireEmail, nomCollab, matricule);
        }

        log.info("Entretien {} supprimé pour {}", id, matricule);
    }

    public EntretienExplicatif create(String matricule, EntretienExplicatifDTO dto) {
        EntretienExplicatif e = new EntretienExplicatif();
        e.setMatricule(matricule);
        mapDtoToEntity(dto, e);
        EntretienExplicatif saved = entretienRepo.save(e);

        Optional<PaqDossier> paqOpt =
                paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);

        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();

            // Permettre l'entretien explicatif si niveau 0 ou 1 (modification)
            if (paq.getNiveau() > 1) {
                throw new RuntimeException(
                        "Le niveau actuel (" + paq.getNiveau() + ") ne permet pas l'entretien explicatif");
            }

            LocalDate dateEntretien = dto.getDate() != null ? dto.getDate() : LocalDate.now();

            // Ne mettre à jour le niveau que si c'est un nouvel entretien (niveau 0)
            if (paq.getNiveau() == 0) {
                paq.setNiveau(1);
                paq.setDatePremierEntretien(dateEntretien);
            }

            String notes = "Type faute: " + dto.getTypeFaute()
                    + " | Description: " + (dto.getDescription() != null ? dto.getDescription() : "")
                    + " | Mesures: " + (dto.getMesuresCorrectives() != null ? dto.getMesuresCorrectives() : "");
            paq.setPremierEntretienNotes(notes);

            String historique = addHistorique(
                    paq.getHistorique(),
                    new PaqController.HistoriqueEvent(
                            dateEntretien,
                            " ENTRETIEN EXPLICATIF",
                            String.format("Entretien explicatif validé le %s — Type de faute : %s",
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

    public EntretienExplicatif update(Long id, EntretienExplicatifDTO dto) {
        EntretienExplicatif e = entretienRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entretien introuvable: " + id));
        mapDtoToEntity(dto, e);
        return entretienRepo.save(e);
    }

    public EntretienExplicatif updateWithPaqUpdate(Long id, String matricule, EntretienExplicatifDTO dto) {
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

            String historique = addHistorique(
                    paq.getHistorique(),
                    new PaqController.HistoriqueEvent(
                            LocalDate.now(),
                            " MODIFICATION ENTRETIEN EXPLICATIF",
                            String.format("Entretien explicatif modifié le %s", LocalDate.now())
                    )
            );
            paq.setHistorique(historique);
            paqRepository.save(paq);
        }

        return updated;
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

    private String getTypeEntretienString(int niveau) {
        return switch (niveau) {
            case 1 -> "EXPLICATIF";
            case 2 -> "ACCORD";
            case 3 -> "MESURE";
            case 4 -> "DECISION";
            default -> "ENTRETIEN";
        };
    }

    private String getCollaborateurNom(String matricule) {
        try {
            return collaborateurRepo.findByMatricule(matricule)
                    .map(c -> c.getName() + " " + c.getPrenom())
                    .orElse(matricule);
        } catch (Exception e) {
            return matricule;
        }
    }

    private void envoyerEmailValidation(String expediteur, String destinataire,
                                        String nomCollab, int niveau,
                                        String matricule, EntretienExplicatifDTO dto, String action) {
        try {
            String typeEntretien = getTypeEntretienString(niveau);
            String sujet = String.format("[PAQ] Entretien %s %s - %s", typeEntretien, action, nomCollab);
            String htmlContent = buildEmailContent(nomCollab, typeEntretien, matricule, dto, action);
            emailService.sendEmail(expediteur, destinataire, sujet, htmlContent);
            log.info("Email envoyé à {} pour l'entretien {} de {}", destinataire, action, matricule);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email à {}: {}", destinataire, e.getMessage());
        }
    }

    private void envoyerEmailSuppression(String expediteur, String destinataire,
                                         String nomCollab, String matricule) {
        try {
            String sujet = String.format("[PAQ] Entretien explicatif supprimé - %s", nomCollab);
            String htmlContent = buildEmailSuppressionContent(nomCollab, matricule);
            emailService.sendEmail(expediteur, destinataire, sujet, htmlContent);
            log.info("Email de suppression envoyé à {} pour {}", destinataire, matricule);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de suppression à {}: {}", destinataire, e.getMessage());
        }
    }

    private String buildEmailContent(String nomCollab, String typeEntretien,
                                     String matricule, EntretienExplicatifDTO dto, String action) {
        return String.format("""
            <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif;">
              <div style="max-width:600px;margin:auto;background:white;border-radius:8px;padding:20px;">
                <div style="background:#C8102E;padding:15px;border-radius:8px 8px 0 0;margin:-20px -20px 0 -20px;">
                  <h2 style="color:white;margin:0;">🏭 PAQ - %s d'entretien</h2>
                </div>
                <div style="padding:20px 0;">
                  <p>Bonjour,</p>
                  <p>Un entretien <strong>%s</strong> a été <strong>%s</strong> pour :</p>
                  <table style="width:100%%;border-collapse:collapse;margin:20px 0;">
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Collaborateur</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Matricule</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Type faute</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Description</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Mesures correctives</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td>
                    </tr>
                   </table>
                </div>
              </div>
            </body></html>
            """, action.equals("créé") ? "Validation" : "Modification",
                typeEntretien, action, nomCollab, matricule,
                dto.getTypeFaute(), dto.getDescription(), dto.getMesuresCorrectives());
    }

    private String buildEmailSuppressionContent(String nomCollab, String matricule) {
        return String.format("""
            <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif;">
              <div style="max-width:600px;margin:auto;background:white;border-radius:8px;padding:20px;">
                <div style="background:#C8102E;padding:15px;border-radius:8px 8px 0 0;margin:-20px -20px 0 -20px;">
                  <h2 style="color:white;margin:0;">🏭 PAQ - Suppression d'entretien</h2>
                </div>
                <div style="padding:20px 0;">
                  <p>Bonjour,</p>
                  <p>L'entretien explicatif pour le collaborateur suivant a été supprimé :</p>
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
            </body></html>
            """, nomCollab, matricule);
    }
}