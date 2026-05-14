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
    private final UserService userService;
    private final ObjectMapper objectMapper;

    public EntretienMesureService(EntretienMesureRepository repo,
                                  PaqRepository paqRepository,
                                  NotificationService notificationService,
                                  EmailService emailService,
                                  CollaboratorRepository collaboratorRepository,
                                  UserService userService) {
        this.repo = repo;
        this.paqRepository = paqRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.collaboratorRepository = collaboratorRepository;
        this.userService = userService;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Historique
    // ─────────────────────────────────────────────────────────────────────────

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

    // ─────────────────────────────────────────────────────────────────────────
    // SL : Créer → email convocation à QM_SEGMENT + SGL
    // ─────────────────────────────────────────────────────────────────────────

    public EntretienMesure createAvecNotification(String matricule,
                                                  EntretienMesureRequestDTO dto,

                                                  String expediteurEmail) {
        EntretienMesure saved = create(matricule, dto, expediteurEmail);
        envoyerEmailsConvocation(expediteurEmail, matricule, dto, getCollaborateurNom(matricule));
        return saved;
    }

    // Dans EntretienMesureService.java
    public EntretienMesure createAvecNotificationMulti(String matricule,
                                                       EntretienMesureRequestDTO dto,
                                                       String expediteurEmail,
                                                       List<String> destinatairesEmails) {
        EntretienMesure saved = create(matricule, dto, expediteurEmail);

        // Envoyer aux destinataires spécifiés + aux rôles
        Set<String> tousDestinataires = new HashSet<>();
        tousDestinataires.addAll(userService.getEmailsByRole("QM_SEGMENT"));
        tousDestinataires.addAll(userService.getEmailsByRole("SGL"));
        if (destinatairesEmails != null) {
            tousDestinataires.addAll(destinatairesEmails);
        }

        for (String email : tousDestinataires) {
            if (email != null && !email.isBlank()) {
                envoyerEmailConvocation(expediteurEmail, email, getCollaborateurNom(matricule), matricule, dto);
            }
        }

        return saved;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SL : Modifier → email convocation à QM_SEGMENT + SGL
    // ─────────────────────────────────────────────────────────────────────────

    public EntretienMesure updateAvecNotification(Long id,
                                                  String matricule,
                                                  EntretienMesureRequestDTO dto,
                                                  String expediteurEmail) {
        EntretienMesure updated = updateWithPaqUpdate(id, matricule, dto);
        envoyerEmailsConvocation(expediteurEmail, matricule, dto, getCollaborateurNom(matricule));
        return updated;
    }

    /**
     * Envoie "Merci d'assister à l'entretien de mesure" à tous les QM_SEGMENT et SGL.
     * Appelé uniquement quand le SL crée ou modifie l'entretien.
     */
    /**
     * Envoie "Merci d'assister à l'entretien de mesure" à tous les QM_SEGMENT et SGL.
     * Appelé uniquement quand le SL crée ou modifie l'entretien.
     */
    private void envoyerEmailsConvocation(String expediteurEmail, String matricule,
                                          EntretienMesureRequestDTO dto, String nomCollab) {
        List<String> destinataires = new ArrayList<>();

        try {
            List<String> qmEmails = userService.getEmailsByRole("QM_SEGMENT");
            if (qmEmails != null && !qmEmails.isEmpty()) {
                destinataires.addAll(qmEmails);
                log.info("📧 {} emails QM_SEGMENT récupérés", qmEmails.size());
            }
        } catch (Exception e) {
            log.error("Erreur récupération emails QM_SEGMENT: {}", e.getMessage());
        }

        try {
            List<String> sglEmails = userService.getEmailsByRole("SGL");
            if (sglEmails != null && !sglEmails.isEmpty()) {
                destinataires.addAll(sglEmails);
                log.info("📧 {} emails SGL récupérés", sglEmails.size());
            }
        } catch (Exception e) {
            log.error("Erreur récupération emails SGL: {}", e.getMessage());
        }

        // Ajouter l'email explicite si fourni
        String explicite = dto.getDestinataireEmail();
        if (explicite != null && !explicite.isBlank() && !destinataires.contains(explicite)) {
            destinataires.add(explicite);
            log.info("📧 Email explicite ajouté: {}", explicite);
        }

        // Envoyer les emails
        int envois = 0;
        for (String email : destinataires) {
            if (email != null && !email.isBlank()) {
                try {
                    envoyerEmailConvocation(expediteurEmail, email, nomCollab, matricule, dto);
                    envois++;
                } catch (Exception e) {
                    log.error("Erreur envoi email à {}: {}", email, e.getMessage());
                }
            }
        }

        if (envois > 0) {
            notificationService.envoyerNotification(
                    expediteurEmail,
                    "📧 Emails de convocation envoyés",
                    "L'entretien de mesure de " + nomCollab
                            + " a été soumis. Email envoyé à " + envois
                            + " destinataire(s) (QM-Segment + SGL)",
                    "SUCCESS", matricule, "MESURE");
        } else {
            log.warn("⚠️ Aucun destinataire trouvé pour l'entretien de mesure de {}", matricule);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QM_SEGMENT : 1ère validation — PAS d'email, historique PAQ uniquement
    // ─────────────────────────────────────────────────────────────────────────

    public EntretienMesure valider1AvecHistorique(Long id,
                                                  String matricule,
                                                  EntretienMesureRequestDTO dto,
                                                  String expediteurEmail) {

        // Récupérer l'entretien existant
        EntretienMesure existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entretien introuvable: " + id));

        // Mettre à jour les données (update partiel)
        if (dto.getTypeFaute() != null) existing.setTypeFaute(dto.getTypeFaute());
        if (dto.getCausesPrincipales() != null) existing.setCausesPrincipales(dto.getCausesPrincipales());
        if (dto.getConvention() != null) existing.setConvention(dto.getConvention());
        if (dto.getPlanAction() != null) existing.setPlanAction(dto.getPlanAction());
        if (dto.getDateEntretien() != null) existing.setDateEntretien(dto.getDateEntretien());
        if (dto.getDateRequalification() != null) existing.setDateRequalification(dto.getDateRequalification());

        // Marquer validé par QM
        existing.setValideParQM(true);
        existing.setDateValidationQM(LocalDate.now());

        EntretienMesure updated = repo.save(existing);

        String nomCollab = getCollaborateurNom(matricule);

        // Mise à jour historique PAQ : validation QM_SEGMENT
        Optional<PaqDossier> paqOpt = paqRepository
                .findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();
            String historique = addHistorique(
                    paq.getHistorique(),
                    new PaqController.HistoriqueEvent(
                            LocalDate.now(),
                            "✅ VALIDATION ENTRETIEN DE MESURE (QM-Segment)",
                            String.format("Entretien de mesure validé par QM-Segment le %s", LocalDate.now())
                    )
            );
            paq.setHistorique(historique);
            paqRepository.save(paq);
            log.info("Historique PAQ mis à jour : validation QM-Segment entretien de mesure pour {}", matricule);
        }

        // Notification interne uniquement, pas d'email
        notificationService.envoyerNotification(
                expediteurEmail,
                "✅ Entretien de mesure validé (QM-Segment)",
                "L'entretien de mesure de " + nomCollab + " a été validé par QM-Segment.",
                "SUCCESS", matricule, "MESURE"
        );

        return updated;
    }

    // ── SGL : 2ème validation — pas d'email, historique PAQ ──────────────────
    public EntretienMesure valider2AvecHistorique(Long id,
                                                  String matricule,
                                                  EntretienMesureRequestDTO dto,
                                                  String expediteurEmail) {

        // Récupérer l'entretien existant
        EntretienMesure existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entretien introuvable: " + id));

        // Vérifier que QM a déjà validé
        if (!existing.isValideParQM()) {
            throw new RuntimeException("La validation par QM-Segment est requise avant la validation SGL");
        }

        // Mettre à jour les données (update partiel)
        if (dto.getTypeFaute() != null) existing.setTypeFaute(dto.getTypeFaute());
        if (dto.getCausesPrincipales() != null) existing.setCausesPrincipales(dto.getCausesPrincipales());
        if (dto.getConvention() != null) existing.setConvention(dto.getConvention());
        if (dto.getPlanAction() != null) existing.setPlanAction(dto.getPlanAction());
        if (dto.getDateEntretien() != null) existing.setDateEntretien(dto.getDateEntretien());
        if (dto.getDateRequalification() != null) existing.setDateRequalification(dto.getDateRequalification());

        // Marquer validé par SGL
        existing.setValideParSGL(true);
        existing.setDateValidationSGL(LocalDate.now());

        EntretienMesure updated = repo.save(existing);

        String nomCollab = getCollaborateurNom(matricule);

        // Mise à jour historique PAQ : validation SGL
        Optional<PaqDossier> paqOpt = paqRepository
                .findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();
            String historique = addHistorique(
                    paq.getHistorique(),
                    new PaqController.HistoriqueEvent(
                            LocalDate.now(),
                            "✅ VALIDATION ENTRETIEN DE MESURE (SGL)",
                            String.format("Entretien de mesure validé par SGL le %s", LocalDate.now())
                    )
            );
            paq.setHistorique(historique);
            paqRepository.save(paq);
            log.info("Historique PAQ mis à jour : validation SGL entretien de mesure pour {}", matricule);
        }

        // Notification interne uniquement, pas d'email
        notificationService.envoyerNotification(
                expediteurEmail,
                "✅ Entretien de mesure validé (SGL)",
                "L'entretien de mesure de " + nomCollab + " a été validé par SGL.",
                "SUCCESS", matricule, "MESURE"
        );

        return updated;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Suppression
    // ─────────────────────────────────────────────────────────────────────────

    public void deleteAvecNotification(Long id, String matricule, String expediteurEmail,
                                       String destinataireEmail, String nomCollab) {
        repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entretien introuvable: " + id));

        repo.deleteById(id);

        Optional<PaqDossier> paqOpt = paqRepository
                .findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
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

    // ─────────────────────────────────────────────────────────────────────────
    // Création (SL)
    // ─────────────────────────────────────────────────────────────────────────

    // ─────────────────────────────────────────────────────────────────────────
// Création (SL)
// ─────────────────────────────────────────────────────────────────────────

    public EntretienMesure create(String matricule, EntretienMesureRequestDTO dto,
                                  String expediteurEmail) {
        LocalDate dateEntretien = dto.getDateEntretien() != null
                ? dto.getDateEntretien() : LocalDate.now();
        validateDates(dateEntretien, dto.getDateRequalification());

        // Récupérer le PAQ actif
        Optional<PaqDossier> paqOpt = paqRepository
                .findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);

        if (paqOpt.isEmpty()) {
            throw new RuntimeException("Aucun dossier PAQ actif trouvé pour le matricule " + matricule);
        }

        PaqDossier paq = paqOpt.get();

        // ✅ CORRECTION: L'entretien de mesure nécessite le niveau 2 (après entretien d'accord)
        if (paq.getNiveau() != 2) {
            throw new RuntimeException("L'entretien de mesure nécessite le niveau 2. Niveau actuel: " + paq.getNiveau()
                    + ". Veuillez d'abord compléter l'entretien d'accord.");
        }

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
        log.info("✅ Entretien mesure créé avec ID: {}", saved.getId());

        // ✅ Mise à jour du PAQ - passage au niveau 3
        paq.setNiveau(3);
        paq.setDateTroisiemeEntretien(dateEntretien);

        String notes = "Type faute: " + dto.getTypeFaute()
                + " | Plan action: " + (dto.getPlanAction() != null ? dto.getPlanAction() : "")
                + " | Convention: " + (dto.getConvention() != null ? dto.getConvention() : "");
        paq.setTroisiemeEntretienNotes(notes);

        String historique = addHistorique(paq.getHistorique(),
                new PaqController.HistoriqueEvent(dateEntretien,
                        " ENTRETIEN DE MESURE (Niveau 2 → 3)",
                        String.format("Entretien de mesure créé le %s — Requalification prévue le %s — Niveau passe de 2 à 3",
                                dateEntretien, dto.getDateRequalification())));
        paq.setHistorique(historique);
        paqRepository.save(paq);

        log.info("Entretien de mesure créé pour {}, niveau PAQ passe de 2 à {}", matricule, paq.getNiveau());

        return saved;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Mise à jour complète (SL) — valide les dates
    // ─────────────────────────────────────────────────────────────────────────

    public EntretienMesure updateWithPaqUpdate(Long id, String matricule,
                                               EntretienMesureRequestDTO dto) {
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

        Optional<PaqDossier> paqOpt = paqRepository
                .findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);
        if (paqOpt.isPresent()) {
            PaqDossier paq = paqOpt.get();

            // ✅ Vérifier que le niveau est bien 3 (après création)
            if (paq.getNiveau() != 3) {
                log.warn("Attention: Modification entretien mesure mais niveau PAQ = {}", paq.getNiveau());
            }

            String notes = "Type faute: " + dto.getTypeFaute()
                    + " | Plan action: " + (dto.getPlanAction() != null ? dto.getPlanAction() : "")
                    + " | Convention: " + (dto.getConvention() != null ? dto.getConvention() : "");
            paq.setTroisiemeEntretienNotes(notes);

            String historique = addHistorique(paq.getHistorique(),
                    new PaqController.HistoriqueEvent(LocalDate.now(),
                            " MODIFICATION ENTRETIEN DE MESURE (Niveau 3)",
                            String.format("Entretien de mesure modifié le %s", LocalDate.now())));
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

    // ─────────────────────────────────────────────────────────────────────────
    // Validation dates (SL uniquement)
    // ─────────────────────────────────────────────────────────────────────────

    private void validateDates(LocalDate entretien, LocalDate requalification) {
        if (entretien == null)
            throw new RuntimeException("Date entretien obligatoire");
        if (requalification == null)
            throw new RuntimeException("Date de requalification obligatoire");
        if (requalification.isBefore(entretien))
            throw new RuntimeException("La requalification ne peut pas être avant l'entretien");
        if (requalification.isAfter(entretien.plusDays(7)))
            throw new RuntimeException(
                    "La requalification doit être programmée au plus tard 7 jours après l'entretien");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private String getCollaborateurNom(String matricule) {
        try {
            return collaboratorRepository.findByMatricule(matricule)
                    .map(c -> c.getName() + " " + c.getPrenom())
                    .orElse(matricule);
        } catch (Exception e) {
            return matricule;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Emails
    // ─────────────────────────────────────────────────────────────────────────

    private void envoyerEmailConvocation(String expediteur, String destinataire,
                                         String nomCollab, String matricule,
                                         EntretienMesureRequestDTO dto) {
        try {
            String sujet = String.format("[PAQ] Convocation — Entretien de mesure : %s", nomCollab);
            emailService.sendEmail(expediteur, destinataire, sujet,
                    buildEmailConvocationContent(nomCollab, matricule, dto));
            log.info("Email convocation mesure → {} pour {}", destinataire, matricule);
        } catch (Exception e) {
            log.error("Erreur email convocation → {} : {}", destinataire, e.getMessage());
        }
    }

    private void envoyerEmailSuppression(String expediteur, String destinataire,
                                         String nomCollab, String matricule) {
        try {
            String sujet = String.format("[PAQ] Entretien de mesure supprimé - %s", nomCollab);
            emailService.sendEmail(expediteur, destinataire, sujet,
                    buildEmailSuppressionContent(nomCollab, matricule));
            log.info("Email suppression mesure → {} pour {}", destinataire, matricule);
        } catch (Exception e) {
            log.error("Erreur email suppression → {} : {}", destinataire, e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Templates HTML
    // ─────────────────────────────────────────────────────────────────────────

    private String buildEmailConvocationContent(String nomCollab, String matricule,
                                                EntretienMesureRequestDTO dto) {
        return String.format("""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family:Arial,sans-serif;background:#f4f6f8;">
          <div style="max-width:600px;margin:auto;background:white;border-radius:8px;
                      overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
            <div style="background:#C8102E;padding:20px 24px;">
              <h2 style="color:white;margin:0;font-size:18px;">
                🏭 PAQ —  Entretien de Mesure
              </h2>
            </div>
            <div style="padding:24px;">
              <p style="font-size:15px;">Bonjour,</p>
              <p style="font-size:15px;font-weight:bold;color:#C8102E;">
                Merci d'assister à l'entretien de mesure.
              </p>
              <p style="font-size:14px;color:#555;">
                Le SL vous invite à participer à l'entretien concernant le collaborateur :
              </p>
              <table style="width:100%%;border-collapse:collapse;margin:20px 0;font-size:14px;">
                <tr style="background:#f8f9fa;">
                  <td style="padding:10px 12px;border:1px solid #dee2e6;font-weight:bold;width:40%%;">Collaborateur</td>
                  <td style="padding:10px 12px;border:1px solid #dee2e6;">%s</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;border:1px solid #dee2e6;font-weight:bold;">Matricule</td>
                  <td style="padding:10px 12px;border:1px solid #dee2e6;">%s</td>
                </tr>
                <tr style="background:#f8f9fa;">
                  <td style="padding:10px 12px;border:1px solid #dee2e6;font-weight:bold;">Type de faute</td>
                  <td style="padding:10px 12px;border:1px solid #dee2e6;">%s</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;border:1px solid #dee2e6;font-weight:bold;">Date de l'entretien</td>
                  <td style="padding:10px 12px;border:1px solid #dee2e6;">%s</td>
                </tr>
                <tr style="background:#f8f9fa;">
                  <td style="padding:10px 12px;border:1px solid #dee2e6;font-weight:bold;">Date de requalification</td>
                  <td style="padding:10px 12px;border:1px solid #dee2e6;">%s</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;border:1px solid #dee2e6;font-weight:bold;">Causes principales</td>
                  <td style="padding:10px 12px;border:1px solid #dee2e6;">%s</td>
                </tr>
                <tr style="background:#f8f9fa;">
                  <td style="padding:10px 12px;border:1px solid #dee2e6;font-weight:bold;">Convention</td>
                  <td style="padding:10px 12px;border:1px solid #dee2e6;">%s</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;border:1px solid #dee2e6;font-weight:bold;">Plan d'action</td>
                  <td style="padding:10px 12px;border:1px solid #dee2e6;">%s</td>
                </tr>
              </table>
              <p style="font-size:14px;color:#555;">
                Connectez-vous au système PAQ pour consulter le dossier complet.
              </p>
            </div>
            <div style="background:#f8f9fa;padding:12px 24px;border-top:1px solid #dee2e6;
                        font-size:12px;color:#888;text-align:center;">
              Email généré automatiquement par le système PAQ.
            </div>
          </div>
        </body>
        </html>
        """,
                nomCollab,
                matricule,
                dto.getTypeFaute()          != null ? dto.getTypeFaute()                          : "",
                dto.getDateEntretien()       != null ? dto.getDateEntretien().toString()            : "",
                dto.getDateRequalification() != null ? dto.getDateRequalification().toString()      : "",
                dto.getCausesPrincipales()   != null ? dto.getCausesPrincipales()                   : "",
                dto.getConvention()          != null ? dto.getConvention()                          : "",
                dto.getPlanAction()          != null ? dto.getPlanAction()                          : "");
    }

    private String buildEmailSuppressionContent(String nomCollab, String matricule) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family:Arial,sans-serif;">
              <div style="max-width:600px;margin:auto;background:white;border-radius:8px;padding:20px;">
                <div style="background:#C8102E;padding:15px;border-radius:8px 8px 0 0;margin:-20px -20px 0 -20px;">
                  <h2 style="color:white;margin:0;">🏭 PAQ — Suppression entretien de mesure</h2>
                </div>
                <div style="padding:20px 0;">
                  <p>Bonjour,</p>
                              <p><strong>Merci d'assister à l'entretien d'accord</strong></p>

                  <p>L'entretien de mesure pour le collaborateur suivant a été supprimé :</p>
                  <table style="width:100%%;border-collapse:collapse;margin:20px 0;">
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Collaborateur</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                    <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Matricule</strong></td>
                        <td style="padding:8px;border:1px solid #ddd;">%s</td></tr>
                  </table>
                  <p style="color:#C8102E;">L'entretien a été supprimé du système.</p>
                </div>
              </div>
            </body>
            </html>
            """, nomCollab, matricule);
    }


}