package com.polytech.paqbackend.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;
import com.polytech.paqbackend.dto.CollaborateurSansFauteDto;
import com.polytech.paqbackend.dto.EnvoyerSlRequest;
import com.polytech.paqbackend.dto.ValiderEntretienPositifRequest;
import com.polytech.paqbackend.entity.Archive;
import com.polytech.paqbackend.entity.Collaborator;
import com.polytech.paqbackend.entity.EntretienPositif;
import com.polytech.paqbackend.entity.PaqDossier;
import com.polytech.paqbackend.repository.ArchiveRepository;
import com.polytech.paqbackend.repository.CollaboratorRepository;
import com.polytech.paqbackend.repository.EntretienPositifRepository;
import com.polytech.paqbackend.repository.PaqRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.ByteArrayOutputStream;
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

    @Autowired
    private ArchiveRepository archiveRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // ── Historique helper ──────────────────────────────────────────────────────

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

        public String getDate()   { return date; }
        public void setDate(String date) { this.date = date; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        public String getDetail() { return detail; }
        public void setDetail(String detail) { this.detail = detail; }
    }

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
            return String.format("[{\"date\":\"%s\",\"action\":\"%s\",\"detail\":\"%s\"}]",
                    LocalDate.now(), action, detail);
        }
    }

    // ── Collaborateurs sans faute ──────────────────────────────────────────────

    public List<CollaborateurSansFauteDto> getCollaborateursSansFaute() {
        LocalDate now = LocalDate.now();
        List<Collaborator> actifs = collaboratorRepository.findByDepartFalseAndArchivedFalse();

        System.out.println("Nombre total de collaborateurs actifs: " + actifs.size());

        List<CollaborateurSansFauteDto> result = new ArrayList<>();

        for (Collaborator c : actifs) {
            try {
                LocalDate derniereFaute = null;
                long joursSansFaute = 0;
                LocalDate dateDebut = c.getHireDate();

                Optional<PaqDossier> paqOpt = paqRepository
                        .findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(c.getMatricule());

                if (paqOpt.isPresent()) {
                    PaqDossier paq = paqOpt.get();
                    derniereFaute = paq.getDerniereFaute();

                    if (derniereFaute != null) {
                        joursSansFaute = ChronoUnit.DAYS.between(derniereFaute, now);
                    } else {
                        dateDebut = paq.getDateCreation() != null ? paq.getDateCreation() : c.getHireDate();
                        joursSansFaute = ChronoUnit.DAYS.between(dateDebut, now);
                    }
                } else {
                    joursSansFaute = ChronoUnit.DAYS.between(c.getHireDate(), now);
                }

                if (joursSansFaute >= 180) {
                    CollaborateurSansFauteDto dto = new CollaborateurSansFauteDto(
                            c.getMatricule(),
                            c.getName(),
                            c.getPrenom() != null ? c.getPrenom() : "",
                            c.getSegment(),
                            c.getHireDate(),
                            derniereFaute,
                            joursSansFaute
                    );
                    result.add(dto);
                }
            } catch (Exception e) {
                System.err.println("Erreur pour collaborateur " + c.getMatricule() + ": " + e.getMessage());
            }
        }

        System.out.println("Nombre de collaborateurs éligibles (>=180 jours): " + result.size());
        return result;
    }

    // ── Envoi email au SL ──────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> envoyerListeSl(EnvoyerSlRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (request.getSlDestinataire() == null || request.getSlDestinataire().isBlank()) {
                throw new RuntimeException("Email SL obligatoire");
            }
            if (!request.getSlDestinataire().matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
                throw new RuntimeException("Adresse email invalide");
            }
            if (request.getDateEnvoi() == null || request.getDateEnvoi().isBlank()) {
                throw new RuntimeException("Date d'envoi obligatoire");
            }

            LocalDate dateEnvoi = LocalDate.parse(request.getDateEnvoi());
            List<CollaborateurSansFauteDto> collaborateurs = getCollaborateursSansFaute();

            List<CollaborateurSansFauteDto> aEnvoyer = collaborateurs;
            if (request.getMatricules() != null && !request.getMatricules().isEmpty()) {
                aEnvoyer = collaborateurs.stream()
                        .filter(c -> request.getMatricules().contains(c.getMatricule()))
                        .collect(Collectors.toList());
            }

            if (aEnvoyer.isEmpty()) {
                throw new RuntimeException("Aucun collaborateur correspondant trouvé");
            }

            EntretienPositif entretien = new EntretienPositif();
            entretien.setSlDestinataire(request.getSlDestinataire());
            entretien.setDateEnvoi(dateEnvoi);
            entretien.setNote(request.getMessage());
            entretien.setCreatedAt(LocalDateTime.now());
            entretien.setMatriculeCollaborateur(
                    aEnvoyer.stream()
                            .map(CollaborateurSansFauteDto::getMatricule)
                            .collect(Collectors.joining(","))
            );
            entretienPositifRepository.save(entretien);

            envoyerEmail(request.getSlDestinataire(), aEnvoyer, request.getMessage(), dateEnvoi);

            response.put("success", true);
            response.put("message", "Email envoyé avec succès à " + request.getSlDestinataire());
            response.put("nb", aEnvoyer.size());

        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        return response;
    }

    private void envoyerEmail(String destinataire,
                              List<CollaborateurSansFauteDto> collaborateurs,
                              String message,
                              LocalDate dateEnvoi) throws Exception {

        if (mailSender == null) {
            throw new RuntimeException("Service mail non configuré (vérifiez application.properties)");
        }

        byte[] pdfBytes = generatePdf(collaborateurs);

        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

        helper.setTo(destinataire);
        helper.setSubject("Entretien Positif – Collaborateurs à féliciter – "
                + dateEnvoi.format(DateTimeFormatter.ofPattern("MMMM yyyy", new Locale("fr"))));

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>")
                .append("<html>")
                .append("<head>")
                .append("<meta charset='UTF-8'>")
                .append("<style>")
                .append("  .email-container { font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; }")
                .append("  .email-header { background: #C8102E; padding: 20px 28px; border-radius: 8px 8px 0 0; }")
                .append("  .email-header h1 { color: white; margin: 0; font-size: 20px; }")
                .append("  .email-header p { color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px; }")
                .append("  .email-body { background: #FFFFFF; border: 1px solid #E0E0E0; border-top: none; padding: 24px 28px; border-radius: 0 0 8px 8px; }")
                .append("  .email-message { background: #FBF0F2; border-left: 4px solid #C8102E; padding: 12px 16px; border-radius: 0 6px 6px 0; margin: 16px 0; }")
                .append("  .email-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }")
                .append("  .email-table th { background: #1a3a5c; color: white; padding: 12px 12px; text-align: left; border: 1px solid #2a4a6c; font-weight: 600; }")
                .append("  .email-table td { padding: 10px 12px; border: 1px solid #E0E0E0; }")
                .append("  .email-table tr:hover { background-color: #f5f5f5; }")
                .append("  .email-table .matricule { font-family: monospace; font-weight: 500; }")
                .append("  .email-table .jours { text-align: right; color: #1A7A46; font-weight: 600; }")
                .append("  .email-footer { color: #6B6B6B; font-size: 12px; margin-top: 20px; text-align: center; border-top: 1px solid #E0E0E0; padding-top: 16px; }")
                .append("</style>")
                .append("</head>")
                .append("<body>");

        html.append("<div class='email-container'>")
                .append("<div class='email-header'>")
                .append("<h1>🏭 Entretien Positif</h1>")
                .append("<p>").append(dateEnvoi.format(DATE_FORMATTER)).append("</p>")
                .append("</div>")
                .append("<div class='email-body'>")
                .append("<p style='color:#4A4A4A;'>Bonjour,</p>")
                .append("<p style='color:#4A4A4A;'>")
                .append("Veuillez trouver ci-dessous la liste des ")
                .append("<strong style='color:#C8102E;'>").append(collaborateurs.size()).append(" collaborateur(s)</strong>")
                .append(" sans faute depuis plus de 6 mois, éligibles à un <strong>entretien positif</strong>.")
                .append("</p>");

        if (message != null && !message.isBlank()) {
            html.append("<div class='email-message'>")
                    .append("<p style='margin:0;color:#4A4A4A;font-size:14px;'>")
                    .append("<strong>📝 Message :</strong> ").append(message)
                    .append("</p></div>");
        }

        html.append("<table class='email-table'>")
                .append("<thead>")
                .append("<tr>")
                .append("<th>👤 Nom</th>")
                .append("<th>👤 Prénom</th>")
                .append("<th>🆔 Matricule</th>")
                .append("<th>📅 Jours sans faute</th>")
                .append("</tr>")
                .append("</thead>")
                .append("<tbody>");

        for (CollaborateurSansFauteDto c : collaborateurs) {
            html.append("<tr>")
                    .append("<td>").append(escapeHtml(c.getNom() != null ? c.getNom() : "")).append("</td>")
                    .append("<td>").append(escapeHtml(c.getPrenom() != null ? c.getPrenom() : "")).append("</td>")
                    .append("<td class='matricule'>").append(escapeHtml(c.getMatricule() != null ? c.getMatricule() : "")).append("</td>")
                    .append("<td class='jours'>").append(c.getJoursSansFaute()).append(" j</td>")
                    .append("</tr>");
        }

        html.append("</tbody>")
                .append("</table>")
                .append("<div class='email-footer'>")
                .append("<p>ℹ️ Ce message est envoyé automatiquement par le système PAQ.</p>")
                .append("<p style='margin-top:8px;'>&copy; 2026 PAQ System - LEONI</p>")
                .append("</div>")
                .append("</div>")
                .append("</div>")
                .append("</body>")
                .append("</html>");

        helper.setText(html.toString(), true);
        helper.addAttachment(
                "collaborateurs_sans_faute_" + dateEnvoi + ".pdf",
                new ByteArrayResource(pdfBytes)
        );

        mailSender.send(mimeMessage);
    }

    // ── Helper pour échapper les caractères HTML ───────────────────────────────
    private String escapeHtml(String text) {
        if (text == null) return "";
        return text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    // ── Archivage entretien positif ────────────────────────────────────────────

    @Transactional
    public Map<String, Object> archiverPaq(ValiderEntretienPositifRequest request) {
        List<String> matricules = request.getMatricules();
        int archivedCount = 0;
        List<String> erreurs = new ArrayList<>();

        for (String matricule : matricules) {
            try {
                Optional<Collaborator> collaboratorOpt = collaboratorRepository.findById(matricule);
                if (!collaboratorOpt.isPresent()) {
                    erreurs.add(matricule + ": Collaborateur non trouvé");
                    continue;
                }
                Collaborator collaborator = collaboratorOpt.get();
                String nomPrenom = collaborator.getName() + " " + collaborator.getPrenom();

                Optional<PaqDossier> ancienPaqOpt = paqRepository
                        .findFirstByCollaboratorMatriculeAndActifTrueAndArchivedFalse(matricule);

                Long paqDossierId = null;

                if (ancienPaqOpt.isPresent()) {
                    PaqDossier ancienPaq = ancienPaqOpt.get();
                    ancienPaq.setArchived(true);
                    ancienPaq.setActif(false);
                    ancienPaq.setStatut("ARCHIVE_POSITIF");
                    ancienPaq.setDateFin(LocalDate.now());
                    String newHistorique = addHistoriqueEvent(
                            ancienPaq.getHistorique(),
                            "Archivage suite entretien positif",
                            "Dossier archivé après entretien positif"
                    );
                    ancienPaq.setHistorique(newHistorique);
                    paqRepository.save(ancienPaq);
                    paqDossierId = ancienPaq.getId();
                }

                Archive archive = new Archive();
                archive.setType("ENTRETIEN_POSITIF");
                archive.setMatricule(matricule);
                archive.setNomPrenom(nomPrenom);
                archive.setDateArchivage(LocalDate.now());
                if (paqDossierId != null) {
                    archive.setPaqDossierId(paqDossierId);
                }
                archiveRepository.save(archive);

                archivedCount++;

            } catch (Exception e) {
                erreurs.add(matricule + ": " + e.getMessage());
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", erreurs.isEmpty());
        response.put("archivedCount", archivedCount);
        response.put("errors", erreurs);
        return response;
    }

    // ── Génération PDF ─────────────────────────────────────────────────────────

    public byte[] generatePdf(List<CollaborateurSansFauteDto> list) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        document.add(new Paragraph("Liste des collaborateurs sans faute")
                .setBold().setFontSize(16));
        document.add(new Paragraph("Générée le : " + LocalDate.now().format(DATE_FORMATTER))
                .setFontSize(10));

        Table table = new Table(new float[]{3, 3, 3, 2});
        table.setWidth(UnitValue.createPercentValue(100));

        String[] headers = {"Nom", "Prénom", "Matricule", "Jours sans faute"};
        for (String header : headers) {
            table.addHeaderCell(new Cell()
                    .add(new Paragraph(header))
                    .setBold()
                    .setBackgroundColor(ColorConstants.LIGHT_GRAY));
        }

        for (CollaborateurSansFauteDto c : list) {
            table.addCell(new Cell().add(new Paragraph(c.getNom() != null ? c.getNom() : "")));
            table.addCell(new Cell().add(new Paragraph(c.getPrenom() != null ? c.getPrenom() : "")));
            table.addCell(new Cell().add(new Paragraph(c.getMatricule() != null ? c.getMatricule() : "")));
            table.addCell(new Cell().add(new Paragraph(String.valueOf(c.getJoursSansFaute()))));
        }

        document.add(table);
        document.close();
        return out.toByteArray();
    }
}