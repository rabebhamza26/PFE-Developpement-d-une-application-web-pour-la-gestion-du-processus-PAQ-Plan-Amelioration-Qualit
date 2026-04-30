package com.polytech.paqbackend.controller;


import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.polytech.paqbackend.dto.CollaborateurSansFauteDto;
import com.polytech.paqbackend.dto.EnvoyerSlRequest;
import com.polytech.paqbackend.dto.ValiderEntretienPositifRequest;
import com.polytech.paqbackend.service.EntretienPositifService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.itextpdf.kernel.colors.ColorConstants;



import org.springframework.web.bind.annotation.GetMapping;

import java.io.ByteArrayOutputStream;
import java.util.List;


import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;




@RestController
@RequestMapping("/api/entretiens-positifs")



public class EntretienPositifController {



    @Autowired
    private EntretienPositifService entretienPositifService;

    @GetMapping("/sans-faute")
    public ResponseEntity<List<CollaborateurSansFauteDto>> getSansFaute() {
        return ResponseEntity.ok(entretienPositifService.getCollaborateursSansFaute());
    }

    @PostMapping("/envoyer-sl")
    public ResponseEntity<?> envoyerListeSl(@RequestBody EnvoyerSlRequest request) {
        return ResponseEntity.ok(entretienPositifService.envoyerListeSl(request));
    }
    @PostMapping("/archiver")
    public ResponseEntity<?> validerEntretienPositif(@RequestBody ValiderEntretienPositifRequest request)
    { return ResponseEntity.ok(entretienPositifService.archiverPaq(request)); }



    @GetMapping("/export-pdf")
    public ResponseEntity<byte[]> exportPdf() {
        try {
            List<CollaborateurSansFauteDto> list =
                    entretienPositifService.getCollaborateursSansFaute();

            ByteArrayOutputStream out = new ByteArrayOutputStream();

            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            document.add(new Paragraph("Liste des collaborateurs sans faute")
                    .setBold()
                    .setFontSize(16));

            Table table = new Table(new float[]{3, 3, 3, 2});
            table.setWidth(UnitValue.createPercentValue(100)); // ✅ iText 7/8

            table.addHeaderCell(new Cell()
                    .add(new Paragraph("Nom"))
                    .setBold()
                    .setBackgroundColor(ColorConstants.LIGHT_GRAY));

            table.addHeaderCell(new Cell()
                    .add(new Paragraph("Prénom"))
                    .setBold()
                    .setBackgroundColor(ColorConstants.LIGHT_GRAY));

            table.addHeaderCell(new Cell()
                    .add(new Paragraph("Matricule"))
                    .setBold()
                    .setBackgroundColor(ColorConstants.LIGHT_GRAY));

            table.addHeaderCell(new Cell()
                    .add(new Paragraph("Jours sans faute"))
                    .setBold()
                    .setBackgroundColor(ColorConstants.LIGHT_GRAY));

            for (CollaborateurSansFauteDto c : list) {
                table.addCell(new Cell().add(new Paragraph(c.getNom())));
                table.addCell(new Cell().add(new Paragraph(c.getPrenom())));
                table.addCell(new Cell().add(new Paragraph(c.getMatricule())));
                table.addCell(new Cell().add(new Paragraph(String.valueOf(c.getJoursSansFaute()))));
            }

            document.add(table);
            document.close();

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=collaborateurs.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(out.toByteArray());

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}



