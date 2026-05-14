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
    private final CollaboratorRepository collaboratorRepository;
    private final UserService userService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public EntretienDecisionService(EntretienDecisionRepository repo,
                                    PaqRepository paqRepository,
                                    CollaboratorRepository collaboratorRepository,
                                    UserService userService,
                                    EmailService emailService,
                                    NotificationService notificationService) {
        this.repo = repo;
        this.paqRepository = paqRepository;
        this.collaboratorRepository = collaboratorRepository;
        this.userService = userService;
        this.emailService = emailService;
        this.notificationService = notificationService;
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

    private String getCollaborateurNom(String matricule) {
        try {
            return collaboratorRepository.findByMatricule(matricule)
                    .map(c -> c.getName() + " " + c.getPrenom())
                    .orElse(matricule);
        } catch (Exception e) {
            return matricule;
        }
    }

    // ✅ Envoi d'emails aux destinataires (comme dans EntretienDaccordService)
    private void envoyerEmailsSL(List<String> destinataires, String messageOptionnel, String matricule, String typeAction) {
        if (destinataires == null || destinataires.isEmpty()) {
            log.warn("Aucun destinataire spécifié pour l'envoi d'email");
            return;
        }

        String nomCollab = getCollaborateurNom(matricule);
        String expediteur = "noreply@leoni.com";

        for (String destinataire : destinataires) {
            if (destinataire != null && !destinataire.isEmpty()) {
                try {
                    String sujet = String.format("[PAQ] Entretien de décision - %s - %s", typeAction, nomCollab);
                    String htmlContent = buildEmailContent(nomCollab, matricule, typeAction, messageOptionnel);

                    // ✅ Même appel que dans EntretienDaccordService: (expediteur, destinataire, sujet, htmlContent)
                    emailService.sendEmail(expediteur, destinataire, sujet, htmlContent);
                    log.info("Email envoyé à: {}", destinataire);

                    // Notification interne
                    notificationService.envoyerNotification(
                            expediteur,
                            "📧 Email envoyé",
                            "Un email concernant " + typeAction + " de l'entretien de décision de " + nomCollab + " a été envoyé à " + destinataire,
                            "SUCCESS", matricule, "DECISION"
                    );
                } catch (Exception e) {
                    log.error("Erreur lors de l'envoi de l'email à {}: {}", destinataire, e.getMessage());
                }
            }
        }
    }

    // ✅ Construction de l'email HTML (comme dans EntretienDaccordService)
    private String buildEmailContent(String nomCollab, String matricule, String typeAction, String messageOptionnel) {
        return String.format("""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width:600px;margin:auto;background:white;border-radius:8px;padding:20px;">
            <div style="background:#C8102E;padding:15px;border-radius:8px 8px 0 0;margin:-20px -20px 0 -20px;">
              <h2 style="color:white;margin:0;">🏭 PAQ - Entretien de décision</h2>
            </div>
            <div style="padding:20px 0;">
              <p>Bonjour,</p>
              <p><strong>Merci d'assister à l'entretien de décision</strong></p>
              <p>Un entretien de décision a été <strong>%s</strong> pour le collaborateur :</p>
              <table style="width:100%%;border-collapse:collapse;margin:20px 0;">
                <tr>
                  <td style="padding:8px;border:1px solid #ddd;"><strong>Collaborateur</strong></td>
                  <td style="padding:8px;border:1px solid #ddd;">%s</td>
                </tr>
                <tr>
                  <td style="padding:8px;border:1px solid #ddd;"><strong>Matricule</strong></td>
                  <td style="padding:8px;border:1px solid #ddd;">%s</td>
                </tr>
                <tr>
                  <td style="padding:8px;border:1px solid #ddd;"><strong>Action</strong></td>
                  <td style="padding:8px;border:1px solid #ddd;">%s</td>
                </tr>
                <tr>
                  <td style="padding:8px;border:1px solid #ddd;"><strong>Date</strong></td>
                  <td style="padding:8px;border:1px solid #ddd;">%s</td>
                </tr>
                %s
              </table>
              <p>Veuillez vous connecter au système PAQ pour valider cet entretien.</p>
            </div>
            <div style="margin-top:20px;padding-top:20px;border-top:1px solid #ddd;font-size:12px;color:#999;">
              <p>Ceci est un message automatique, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
        </html>
        """,
                typeAction.equals("CRÉATION") ? "créé" :
                        typeAction.equals("MODIFICATION") ? "modifié" :
                                typeAction.equals("VALIDATION SL") ? "soumis pour validation" : typeAction.toLowerCase(),
                nomCollab,
                matricule,
                typeAction,
                LocalDate.now(),
                (messageOptionnel != null && !messageOptionnel.isEmpty()) ?
                        String.format("<tr><td style=\"padding:8px;border:1px solid #ddd;\"><strong>Message</strong></td><td style=\"padding:8px;border:1px solid #ddd;\">%s</td></tr>", messageOptionnel) : ""
        );
    }

    public EntretienDecision createAvecNotification(String matricule,
                                                    EntretienDecisionRequestDTO dto,
                                                    String expediteurEmail) {
        EntretienDecision result = create(matricule, dto, expediteurEmail);

        // Envoyer email aux destinataires
        if (dto.getDestinatairesEmails() != null && !dto.getDestinatairesEmails().isEmpty()) {
            envoyerEmailsSL(dto.getDestinatairesEmails(), dto.getMessageOptionnel(), matricule, "CRÉATION");
        }

        return result;
    }

    public EntretienDecision updateAvecNotification(Long id,
                                                    String matricule,
                                                    EntretienDecisionRequestDTO dto,
                                                    String expediteurEmail) {
        EntretienDecision result = updateWithPaqUpdate(id, matricule, dto);

        // Envoyer email aux destinataires
        if (dto.getDestinatairesEmails() != null && !dto.getDestinatairesEmails().isEmpty()) {
            envoyerEmailsSL(dto.getDestinatairesEmails(), dto.getMessageOptionnel(), matricule, "MODIFICATION");
        }

        return result;
    }

    // ✅ SL valide - Avec envoi d'emails
    public EntretienDecision validerParSL(Long id,
                                          String matricule,
                                          EntretienDecisionRequestDTO dto,
                                          String expediteurEmail) {
        log.info("validerParSL - Début pour ID: {}, Matricule: {}", id, matricule);

        // 1. Mettre à jour l'entretien
        EntretienDecision updated = updateWithPaqUpdate(id, matricule, dto);
        log.info("Entretien mis à jour: {}", updated.getId());

        // 2. Envoyer emails aux destinataires
        if (dto.getDestinatairesEmails() != null && !dto.getDestinatairesEmails().isEmpty()) {
            envoyerEmailsSL(dto.getDestinatairesEmails(), dto.getMessageOptionnel(), matricule, "VALIDATION SL");
        } else {
            log.warn("Aucun destinataire spécifié pour la validation SL");
        }

        // 3. Ajouter dans l'historique du PAQ (MAIS NE PAS CHANGER LE NIVEAU)
        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();
            String historique = addHistorique(
                    paq.getHistorique(),
                    new PaqController.HistoriqueEvent(
                            LocalDate.now(),
                            "SOUMISSION ENTRETIEN DE DÉCISION",
                            String.format("Entretien de décision soumis par SL le %s - En attente de validation", LocalDate.now())
                    )
            );
            paq.setHistorique(historique);
            paqRepository.save(paq);
            log.info("Historique PAQ mis à jour - Niveau inchangé: {}", paq.getNiveau());
        } else {
            log.warn("PAQ non trouvé pour le matricule: {}", matricule);
        }

        return updated;
    }

    // ✅ HP ou SGL valident - PAS D'EMAIL ET PAS DE CHANGEMENT DE NIVEAU
    public EntretienDecision validerParHPSGL(Long id,
                                             String matricule,
                                             EntretienDecisionRequestDTO dto,
                                             String expediteurEmail) {
        log.info("validerParHPSGL - Début pour ID: {}, Matricule: {}", id, matricule);

        EntretienDecision updated = updateWithPaqUpdate(id, matricule, dto);
        log.info("Entretien mis à jour: {}", updated.getId());

        // NE PAS ENVOYER D'EMAIL
        // NE PAS CHANGER LE NIVEAU AUTOMATIQUEMENT

        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();
            String historique = addHistorique(
                    paq.getHistorique(),
                    new PaqController.HistoriqueEvent(
                            LocalDate.now(),
                            "PREMIÈRE VALIDATION ENTRETIEN DE DÉCISION",
                            String.format("Entretien de décision validé par %s le %s - En attente de validation QM_PLANT", expediteurEmail, LocalDate.now())
                    )
            );
            paq.setHistorique(historique);
            paqRepository.save(paq);
            log.info("Historique PAQ mis à jour - Niveau inchangé: {}", paq.getNiveau());
        }

        return updated;
    }

    // ✅ QM_PLANT valide - PAS D'EMAIL ET PAS DE CHANGEMENT DE NIVEAU AUTOMATIQUE
    public EntretienDecision validerParQMPlant(Long id,
                                               String matricule,
                                               EntretienDecisionRequestDTO dto,
                                               String expediteurEmail) {
        log.info("validerParQMPlant - Début pour ID: {}, Matricule: {}", id, matricule);

        EntretienDecision updated = updateWithPaqUpdate(id, matricule, dto);
        log.info("Entretien mis à jour: {}", updated.getId());

        // NE PAS ENVOYER D'EMAIL
        // NE PAS CHANGER LE NIVEAU AUTOMATIQUEMENT

        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();
            String historique = addHistorique(
                    paq.getHistorique(),
                    new PaqController.HistoriqueEvent(
                            LocalDate.now(),
                            "DEUXIÈME VALIDATION ENTRETIEN DE DÉCISION",
                            String.format("Entretien de décision validé par QM_PLANT le %s - En attente de finalisation dans le dossier PAQ", LocalDate.now())
                    )
            );
            paq.setHistorique(historique);
            paqRepository.save(paq);
            log.info("Historique PAQ mis à jour - Niveau inchangé: {}", paq.getNiveau());
        }

        return updated;
    }

    public void deleteAvecNotification(Long id, String matricule, String expediteurEmail, String destinataireEmail, String nomCollab) {
        repo.deleteById(id);

        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();
            String historique = addHistorique(
                    paq.getHistorique(),
                    new PaqController.HistoriqueEvent(
                            LocalDate.now(),
                            "SUPPRESSION ENTRETIEN DE DÉCISION",
                            String.format("Entretien de décision supprimé le %s", LocalDate.now())
                    )
            );
            paq.setHistorique(historique);
            paqRepository.save(paq);
        }
        log.info("Entretien de décision {} supprimé", id);
    }

    public EntretienDecision create(String matricule, EntretienDecisionRequestDTO dto, String expediteurEmail) {
        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);

        if (paqOpt.isEmpty()) {
            throw new RuntimeException("Aucun dossier PAQ actif trouvé pour le matricule : " + matricule);
        }

        PaqDossier paq = paqOpt.get();

        if (paq.getNiveau() < 3 || paq.getNiveau() > 4) {
            throw new RuntimeException("Le niveau actuel (" + paq.getNiveau() + ") ne permet pas l'entretien de décision");
        }

        EntretienDecision entretien = new EntretienDecision();
        entretien.setMatricule(matricule);
        entretien.setTypeFaute(dto.getTypeFaute());
        entretien.setDateEntretien(dto.getDateEntretien() != null ? dto.getDateEntretien() : LocalDate.now());
        entretien.setDecision(dto.getDecision());
        entretien.setJustification(dto.getJustification());
        entretien.setDateCreation(LocalDate.now());

        EntretienDecision saved = repo.save(entretien);

        // NE PAS CHANGER LE NIVEAU AUTOMATIQUEMENT
        paq.setQuatriemeEntretienNotes(dto.getDecision());

        String historique = addHistorique(paq.getHistorique(),
                new PaqController.HistoriqueEvent(
                        entretien.getDateEntretien(),
                        "ENTRETIEN DE DÉCISION",
                        String.format("Entretien de décision créé le %s — Décision : %s",
                                entretien.getDateEntretien(), dto.getDecision())
                )
        );
        paq.setHistorique(historique);
        paqRepository.save(paq);

        return saved;
    }

    public EntretienDecision updateWithPaqUpdate(Long id, String matricule, EntretienDecisionRequestDTO dto) {
        EntretienDecision existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entretien introuvable: " + id));

        if (dto.getTypeFaute() != null) existing.setTypeFaute(dto.getTypeFaute());
        if (dto.getDateEntretien() != null) existing.setDateEntretien(dto.getDateEntretien());
        if (dto.getDecision() != null) existing.setDecision(dto.getDecision());
        if (dto.getJustification() != null) existing.setJustification(dto.getJustification());

        EntretienDecision updated = repo.save(existing);

        Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();
            paq.setQuatriemeEntretienNotes(dto.getDecision());

            String historique = addHistorique(
                    paq.getHistorique(),
                    new PaqController.HistoriqueEvent(
                            LocalDate.now(),
                            "MODIFICATION ENTRETIEN DE DÉCISION",
                            String.format("Entretien de décision modifié le %s", LocalDate.now())
                    )
            );
            paq.setHistorique(historique);
            paqRepository.save(paq);
        }

        return updated;
    }

    public EntretienDecision findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Entretien introuvable id=" + id));
    }

    public List<EntretienDecision> findByMatricule(String matricule) {
        return repo.findByMatricule(matricule);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}