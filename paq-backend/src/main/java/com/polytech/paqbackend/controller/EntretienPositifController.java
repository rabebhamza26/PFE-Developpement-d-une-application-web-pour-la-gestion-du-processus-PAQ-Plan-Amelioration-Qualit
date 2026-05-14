package com.polytech.paqbackend.controller;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.polytech.paqbackend.dto.CollaborateurSansFauteDto;
import com.polytech.paqbackend.dto.ValiderEntretienPositifRequest;
import com.polytech.paqbackend.service.EntretienPositifService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.itextpdf.kernel.colors.ColorConstants;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;

@RestController
@RequestMapping("/api/entretiens-positifs")
public class EntretienPositifController {

    @Autowired
    private EntretienPositifService entretienPositifService;

    /**
     * Récupérer la liste des collaborateurs sans faute
     * Accessible uniquement par SL
     */
    @GetMapping("/sans-faute")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<List<CollaborateurSansFauteDto>> getSansFaute() {
        return ResponseEntity.ok(entretienPositifService.getCollaborateursSansFaute());
    }

    /**
     * Archiver/valider l'entretien positif
     * Accessible uniquement par SL
     */
    @PostMapping("/archiver")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<?> validerEntretienPositif(@RequestBody ValiderEntretienPositifRequest request) {
        return ResponseEntity.ok(entretienPositifService.archiverPaq(request));
    }

    /**
     * Exporter la liste en PDF
     * Accessible uniquement par SL
     */
    @GetMapping("/export-pdf")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<byte[]> exportPdf() {
        try {
            List<CollaborateurSansFauteDto> list = entretienPositifService.getCollaborateursSansFaute();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            document.add(new Paragraph("🎉 FÉLICITATIONS - COLLABORATEURS À FÉLICITER 🎉")
                    .setBold().setFontSize(16).setFontColor(ColorConstants.GREEN));
            document.add(new Paragraph("Généré le : " + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                    .setFontSize(10));

            Table table = new Table(new float[]{3, 3, 3, 2});
            table.setWidth(UnitValue.createPercentValue(100));

            table.addHeaderCell(new Cell().add(new Paragraph("Nom")).setBold().setBackgroundColor(ColorConstants.GREEN));
            table.addHeaderCell(new Cell().add(new Paragraph("Prénom")).setBold().setBackgroundColor(ColorConstants.GREEN));
            table.addHeaderCell(new Cell().add(new Paragraph("Matricule")).setBold().setBackgroundColor(ColorConstants.GREEN));
            table.addHeaderCell(new Cell().add(new Paragraph("Jours sans faute")).setBold().setBackgroundColor(ColorConstants.GREEN));

            for (CollaborateurSansFauteDto c : list) {
                table.addCell(new Cell().add(new Paragraph(c.getNom() != null ? c.getNom() : "")));
                table.addCell(new Cell().add(new Paragraph(c.getPrenom() != null ? c.getPrenom() : "")));
                table.addCell(new Cell().add(new Paragraph(c.getMatricule() != null ? c.getMatricule() : "")));
                table.addCell(new Cell().add(new Paragraph(String.valueOf(c.getJoursSansFaute()))));
            }

            document.add(table);
            document.close();

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=collaborateurs_a_feliciter.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(out.toByteArray());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Ajoutez cet endpoint dans EntretienPositifController.java

    @PostMapping("/test-envoi-auto")
    @PreAuthorize("hasRole('SL')")
    public ResponseEntity<?> testEnvoiAutomatique() {
        try {
            // Appel manuel de la méthode d'envoi automatique
            entretienPositifService.envoyerAutomatiquementAuxSL();
            return ResponseEntity.ok(Map.of(
                    "message", "Test d'envoi automatique déclenché avec succès",
                    "status", "SUCCESS"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur: " + e.getMessage()));
        }
    }
}