package com.polytech.paqbackend.service;

import com.polytech.paqbackend.dto.CollaborateurSansFauteDto;
import com.polytech.paqbackend.dto.EnvoyerSlRequest;
import com.polytech.paqbackend.dto.ValiderEntretienPositifRequest;
import com.polytech.paqbackend.entity.Collaborator;
import com.polytech.paqbackend.entity.EntretienPositif;
import com.polytech.paqbackend.entity.PaqDossier;
import com.polytech.paqbackend.repository.CollaboratorRepository;
import com.polytech.paqbackend.repository.EntretienPositifRepository;
import com.polytech.paqbackend.repository.PaqRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EntretienPositifService {

    @Autowired
    private CollaboratorRepository collaboratorRepository;

    @Autowired
    private PaqRepository paqRepository;

    @Autowired
    private EntretienPositifRepository entretienPositifRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Classe interne pour l'historique
     */
    public static class HistoriqueEvent {
        private String date;
        private String action;
        private String detail;

        public HistoriqueEvent() {}

        public HistoriqueEvent(String date, String action, String detail) {
            this.date = date;
            this.action = action;
            this.detail = detail;
        }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public String getDetail() { return detail; }
        public void setDetail(String detail) { this.detail = detail; }
    }

    /**
     * Ajoute un événement à l'historique JSON
     */
    private String addHistoriqueEvent(String historiqueJson, String action, String detail) {
        try {
            List<HistoriqueEvent> list;
            if (historiqueJson == null || historiqueJson.isBlank() || "[]".equals(historiqueJson)) {
                list = new ArrayList<>();
            } else {
                list = objectMapper.readValue(historiqueJson, new TypeReference<List<HistoriqueEvent>>() {});
            }

            list.add(new HistoriqueEvent(LocalDate.now().toString(), action, detail));
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            e.printStackTrace();
            return String.format("[{\"date\":\"%s\",\"action\":\"%s\",\"detail\":\"%s\"}]",
                    LocalDate.now(), action, detail);
        }
    }

    /**
     * Récupère les collaborateurs sans aucune faute depuis 6 mois
     * Pour les collaborateurs niveau 0, on vérifie depuis la date d'embauche
     * Pour les autres, on vérifie depuis la dernière faute
     */
    public List<CollaborateurSansFauteDto> getCollaborateursSansFaute() {
        LocalDate now = LocalDate.now();
        LocalDate sixMonthsAgo = now.minusMonths(6);

        List<Collaborator> actifs = collaboratorRepository.findByDepartFalseAndArchivedFalse();

        return actifs.stream()
                .map(c -> {
                    LocalDate derniereFaute = null;
                    LocalDate dateDebut = c.getHireDate(); // Utiliser date d'embauche par défaut
                    long joursSansFaute = 0;
                    boolean hasActivePaq = false;

                    Optional<PaqDossier> paqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(c.getMatricule());

                    if (paqOpt.isPresent()) {
                        PaqDossier paq = paqOpt.get();
                        derniereFaute = paq.getDerniereFaute();
                        hasActivePaq = true;

                        // Si le collaborateur a une faute enregistrée
                        if (derniereFaute != null) {
                            joursSansFaute = ChronoUnit.DAYS.between(derniereFaute, now);
                            dateDebut = derniereFaute;
                        }
                        // Si le collaborateur n'a jamais eu de faute (niveau 0)
                        else {
                            // Pour les collaborateurs niveau 0, on utilise la date d'embauche
                            // ou la date de création du PAQ si elle est plus ancienne
                            if (paq.getNiveau() == 0) {
                                dateDebut = c.getHireDate();
                                // Si le PAQ a été créé après la date d'embauche, utiliser la date d'embauche
                                if (paq.getDateCreation() != null && paq.getDateCreation().isAfter(c.getHireDate())) {
                                    dateDebut = c.getHireDate();
                                } else if (paq.getDateCreation() != null) {
                                    dateDebut = paq.getDateCreation();
                                }
                            } else {
                                // Pour les niveaux > 0, utiliser la date de création du PAQ
                                dateDebut = paq.getDateCreation() != null ? paq.getDateCreation() : c.getHireDate();
                            }
                            joursSansFaute = ChronoUnit.DAYS.between(dateDebut, now);
                        }
                    } else {
                        // Pas de PAQ actif, le collaborateur n'a jamais eu de PAQ
                        // Donc il est au niveau 0 par défaut
                        joursSansFaute = ChronoUnit.DAYS.between(c.getHireDate(), now);
                        dateDebut = c.getHireDate();
                    }

                    System.out.println("Collaborateur: " + c.getMatricule() +
                            " - Nom: " + c.getName() +
                            " - Niveau PAQ: " + (hasActivePaq ? paqOpt.get().getNiveau() : "0") +
                            " - Date embauche: " + c.getHireDate() +
                            " - Date début: " + dateDebut +
                            " - Jours sans faute: " + joursSansFaute +
                            " - Dernière faute: " + derniereFaute);

                    return new CollaborateurSansFauteDto(
                            c.getMatricule(),
                            c.getName(),
                            c.getPrenom(),
                            c.getSegment(),
                            c.getHireDate(),
                            derniereFaute,
                            joursSansFaute
                    );
                })
                .filter(dto -> dto.getJoursSansFaute() >= 180) // 6 mois = 180 jours
                .collect(Collectors.toList());
    }

    /**
     * Envoie la liste au SL par email et enregistre dans la base
     */
    @Transactional
    public Map<String, Object> envoyerListeSl(EnvoyerSlRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            List<CollaborateurSansFauteDto> collaborateurs = getCollaborateursSansFaute();

            // Filtrer par matricules si spécifiés
            List<CollaborateurSansFauteDto> aEnvoyer = collaborateurs;
            if (request.getMatricules() != null && !request.getMatricules().isEmpty()) {
                aEnvoyer = collaborateurs.stream()
                        .filter(c -> request.getMatricules().contains(c.getMatricule()))
                        .collect(Collectors.toList());
            }

            // Enregistrer dans la base
            EntretienPositif entretien = new EntretienPositif();
            entretien.setSlDestinataire(request.getSlDestinataire());
            entretien.setDateEnvoi(request.getDateEnvoi());
            entretien.setNote(request.getMessage());
            entretien.setCreatedAt(LocalDateTime.now());

            // Enregistrer les matricules des collaborateurs (optionnel)
            if (aEnvoyer != null && !aEnvoyer.isEmpty()) {
                StringBuilder matriculesStr = new StringBuilder();
                for (CollaborateurSansFauteDto c : aEnvoyer) {
                    if (matriculesStr.length() > 0) matriculesStr.append(",");
                    matriculesStr.append(c.getMatricule());
                }
                entretien.setMatriculeCollaborateur(matriculesStr.toString());
            }

            entretienPositifRepository.save(entretien);

            // Envoyer l'email si mailSender est configuré
            boolean emailEnvoye = false;
            if (mailSender != null) {
                try {
                    envoyerEmail(request.getSlDestinataire(), aEnvoyer, request.getMessage(), request.getDateEnvoi());
                    emailEnvoye = true;
                } catch (Exception e) {
                    System.err.println("Erreur envoi email: " + e.getMessage());
                }
            }

            response.put("success", true);
            response.put("message", emailEnvoye ? "Liste envoyée par email au SL" : "Liste enregistrée (email non configuré)");
            response.put("destinataire", request.getSlDestinataire());
            response.put("dateEnvoi", request.getDateEnvoi());
            response.put("nbCollaborateurs", aEnvoyer.size());
            response.put("collaborateurs", aEnvoyer);

        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Erreur: " + e.getMessage());
        }

        return response;
    }
    /**
     * Archive l'ancien PAQ et crée un nouveau PAQ niveau 0
     */
    @Transactional
    public Map<String, Object> archiverEtCreerNouveauPaq(ValiderEntretienPositifRequest request) {
        List<String> matricules = request.getMatricules();
        LocalDate now = LocalDate.now();

        int archivedCount = 0;
        int createdCount = 0;
        List<String> erreurs = new ArrayList<>();

        // Récupérer les collaborateurs éligibles
        List<CollaborateurSansFauteDto> eligibles = getCollaborateursSansFaute();
        List<String> matriculesEligibles = eligibles.stream()
                .map(CollaborateurSansFauteDto::getMatricule)
                .collect(Collectors.toList());

        // Si aucun matricule spécifié, prendre tous les éligibles
        List<String> aTraiter = (matricules == null || matricules.isEmpty())
                ? matriculesEligibles
                : matricules.stream()
                .filter(matriculesEligibles::contains)
                .collect(Collectors.toList());

        for (String matricule : aTraiter) {
            try {
                // Récupérer le collaborateur pour avoir sa date d'embauche
                Optional<Collaborator> collaboratorOpt = collaboratorRepository.findById(matricule);
                if (!collaboratorOpt.isPresent()) {
                    erreurs.add(matricule + ": Collaborateur non trouvé");
                    continue;
                }
                Collaborator collaborator = collaboratorOpt.get();

                // 1. Archiver l'ancien PAQ actif
                Optional<PaqDossier> ancienPaqOpt = paqRepository.findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);

                if (ancienPaqOpt.isPresent()) {
                    PaqDossier ancienPaq = ancienPaqOpt.get();
                    ancienPaq.setArchived(true);
                    ancienPaq.setActif(false);
                    ancienPaq.setStatut("ARCHIVE_POSITIF");
                    ancienPaq.setDateFin(now);

                    // Ajouter à l'historique
                    String newHistorique = addHistoriqueEvent(ancienPaq.getHistorique(),
                            "Archivage suite entretien positif",
                            "Dossier archivé après entretien positif, nouveau dossier créé");
                    ancienPaq.setHistorique(newHistorique);

                    paqRepository.save(ancienPaq);
                    archivedCount++;
                }

                // 2. Créer un nouveau PAQ niveau 0 avec la date d'embauche comme référence
                PaqDossier nouveauPaq = new PaqDossier();
                nouveauPaq.setCollaboratorMatricule(matricule);
                // Utiliser la date d'embauche comme date de création pour les nouveaux PAQ
                nouveauPaq.setDateCreation(collaborator.getHireDate());
                nouveauPaq.setDateFin(collaborator.getHireDate().plusMonths(6));
                nouveauPaq.setCreatedAt(LocalDateTime.now());
                nouveauPaq.setNiveau(0);
                nouveauPaq.setStatut("EN_COURS");
                nouveauPaq.setActif(true);
                nouveauPaq.setArchived(false);
                nouveauPaq.setDerniereFaute(null); // Réinitialiser les fautes

                // Ajouter à l'historique
                String historique = addHistoriqueEvent(null,
                        "Création suite entretien positif",
                        "Nouveau dossier créé après validation de l'entretien positif");
                nouveauPaq.setHistorique(historique);

                paqRepository.save(nouveauPaq);
                createdCount++;

                System.out.println("Entretien positif validé pour: " + matricule);

            } catch (Exception e) {
                erreurs.add(matricule + ": " + e.getMessage());
                System.err.println("Erreur pour " + matricule + ": " + e.getMessage());
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", erreurs.isEmpty());
        response.put("message", "Entretien positif validé pour " + createdCount + " collaborateurs");
        response.put("archivedCount", archivedCount);
        response.put("createdCount", createdCount);
        response.put("errors", erreurs);

        return response;
    }

    /**
     * Envoie un email au SL avec la liste des collaborateurs à féliciter
     */
    private void envoyerEmail(String destinataire, List<CollaborateurSansFauteDto> collaborateurs,
                              String message, LocalDate dateEnvoi) throws Exception {
        if (mailSender == null) return;

        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

        helper.setTo(destinataire);
        helper.setSubject("Entretien Positif - Collaborateurs sans faute");

        StringBuilder html = new StringBuilder();
        html.append("<html><body>");
        html.append("<h2>🏆 Entretien Positif</h2>");
        html.append("<p>📅 Date d'envoi: <strong>").append(dateEnvoi.format(DATE_FORMATTER)).append("</strong></p>");
        html.append("<h3>✨ Collaborateurs sans aucune faute depuis 6 mois :</h3>");
        html.append("<table border='1' cellpadding='8' cellspacing='0' style='border-collapse: collapse; width: 100%;'>");
        html.append("<tr style='background-color: #4CAF50; color: white;'>");
        html.append("<th>Matricule</th><th>Nom</th><th>Prénom</th><th>Segment</th><th>Jours sans faute</th>");
        html.append("</tr>");

        for (CollaborateurSansFauteDto c : collaborateurs) {
            html.append("<tr>");
            html.append("<td>").append(c.getMatricule()).append("</td>");
            html.append("<td>").append(c.getNom()).append("</td>");
            html.append("<td>").append(c.getPrenom() != null ? c.getPrenom() : "").append("</td>");
            html.append("<td>").append(c.getSegment()).append("</td>");
            html.append("<td>").append(c.getJoursSansFaute()).append(" jours</td>");
            html.append("</tr>");
        }

        html.append("</table>");
        if (message != null && !message.isEmpty()) {
            html.append("<p><strong>📝 Note:</strong> ").append(message).append("</p>");
        }
        html.append("<p><br/>✅ <strong>Action requise:</strong> Veuillez organiser un entretien positif avec ces collaborateurs.</p>");
        html.append("</body></html>");

        helper.setText(html.toString(), true);
        mailSender.send(mimeMessage);

        System.out.println("Email envoyé à: " + destinataire + " pour " + collaborateurs.size() + " collaborateurs");
    }
}