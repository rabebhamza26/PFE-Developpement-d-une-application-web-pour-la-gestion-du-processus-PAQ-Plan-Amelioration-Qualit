package com.polytech.paqbackend.service;



import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.polytech.paqbackend.dto.DashboardStatsDTO;
import com.polytech.paqbackend.dto.SegmentStatsDTO;
import com.polytech.paqbackend.dto.PerformanceHistoryDTO;
import com.polytech.paqbackend.dto.CollaborateurDTO;

import org.springframework.stereotype.Service;
import org.apache.poi.ss.usermodel.*;
        import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Cell;


import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class ExportService {

    private final DashboardService dashboardService;

    public ExportService(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    public byte[] generatePdfReport() throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(outputStream);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document = new Document(pdfDoc);

        // Titre
        document.add(new Paragraph("Rapport Semestriel PAQ")
                .setFontSize(20)
                .setTextAlignment(TextAlignment.CENTER));

        // Statistiques générales
        DashboardStatsDTO stats = dashboardService.getStats();
        document.add(new Paragraph("Statistiques Générales").setFontSize(16));

        Table generalTable = new Table(UnitValue.createPercentArray(new float[]{2, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        generalTable.addCell("Total Collaborateurs");
        generalTable.addCell(String.valueOf(stats.getTotalCollaborateurs()));
        generalTable.addCell("PAQ en Cours");
        generalTable.addCell(String.valueOf(stats.getTotalPaqs()));
        generalTable.addCell("Sans Faute");
        generalTable.addCell(String.valueOf(stats.getSansFaute().size()));

        document.add(generalTable);

        // Statistiques par segment
        document.add(new Paragraph("Statistiques par Segment").setFontSize(16));
        List<SegmentStatsDTO> segmentStats = dashboardService.getSegmentStats();

        Table segmentTable = new Table(UnitValue.createPercentArray(new float[]{2, 1, 1, 1, 1, 1, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        segmentTable.addHeaderCell("Segment");
        segmentTable.addHeaderCell("Total");
        segmentTable.addHeaderCell("Niveau 1");
        segmentTable.addHeaderCell("Niveau 2");
        segmentTable.addHeaderCell("Niveau 3");
        segmentTable.addHeaderCell("Niveau 4");
        segmentTable.addHeaderCell("Niveau 5");

        for (SegmentStatsDTO seg : segmentStats) {
            segmentTable.addCell(seg.getNom());
            segmentTable.addCell(String.valueOf(seg.getTotalCollaborateurs()));
            segmentTable.addCell(String.valueOf(seg.getPaqNiveau1()));
            segmentTable.addCell(String.valueOf(seg.getPaqNiveau2()));
            segmentTable.addCell(String.valueOf(seg.getPaqNiveau3()));
            segmentTable.addCell(String.valueOf(seg.getPaqNiveau4()));
            segmentTable.addCell(String.valueOf(seg.getPaqNiveau5()));
        }

        document.add(segmentTable);

        document.close();
        return outputStream.toByteArray();
    }

    public byte[] generateExcelReport() throws IOException {
        Workbook workbook = new XSSFWorkbook();

        // Feuille statistiques générales
        Sheet generalSheet = workbook.createSheet("Statistiques Générales");
        DashboardStatsDTO stats = dashboardService.getStats();

        Row headerRow = generalSheet.createRow(0);
        headerRow.createCell(0).setCellValue("Métrique");
        headerRow.createCell(1).setCellValue("Valeur");

        Row row1 = generalSheet.createRow(1);
        row1.createCell(0).setCellValue("Total Collaborateurs");
        row1.createCell(1).setCellValue(stats.getTotalCollaborateurs());

        Row row2 = generalSheet.createRow(2);
        row2.createCell(0).setCellValue("PAQ en Cours");
        row2.createCell(1).setCellValue(stats.getTotalPaqs());

        Row row3 = generalSheet.createRow(3);
        row3.createCell(0).setCellValue("Sans Faute");
        row3.createCell(1).setCellValue(stats.getSansFaute().size());

        // Feuille statistiques par segment
        Sheet segmentSheet = workbook.createSheet("Statistiques par Segment");
        List<SegmentStatsDTO> segmentStats = dashboardService.getSegmentStats();

        Row segHeader = segmentSheet.createRow(0);
        segHeader.createCell(0).setCellValue("Segment");
        segHeader.createCell(1).setCellValue("Total");
        segHeader.createCell(2).setCellValue("Niveau 1");
        segHeader.createCell(3).setCellValue("Niveau 2");
        segHeader.createCell(4).setCellValue("Niveau 3");
        segHeader.createCell(5).setCellValue("Niveau 4");
        segHeader.createCell(6).setCellValue("Niveau 5");
        segHeader.createCell(7).setCellValue("Sans Faute");

        int rowNum = 1;
        for (SegmentStatsDTO seg : segmentStats) {
            Row row = segmentSheet.createRow(rowNum++);
            row.createCell(0).setCellValue(seg.getNom());
            row.createCell(1).setCellValue(seg.getTotalCollaborateurs());
            row.createCell(2).setCellValue(seg.getPaqNiveau1());
            row.createCell(3).setCellValue(seg.getPaqNiveau2());
            row.createCell(4).setCellValue(seg.getPaqNiveau3());
            row.createCell(5).setCellValue(seg.getPaqNiveau4());
            row.createCell(6).setCellValue(seg.getPaqNiveau5());
            row.createCell(7).setCellValue(seg.getSansFaute());
        }

        // Feuille historique de performance
        Sheet historySheet = workbook.createSheet("Historique Performance");
        List<PerformanceHistoryDTO> history = dashboardService.getPerformanceHistory();

        Row histHeader = historySheet.createRow(0);
        histHeader.createCell(0).setCellValue("Matricule");
        histHeader.createCell(1).setCellValue("Nom");
        histHeader.createCell(2).setCellValue("Période");
        histHeader.createCell(3).setCellValue("Niveau PAQ");
        histHeader.createCell(4).setCellValue("Évolution");

        rowNum = 1;
        for (PerformanceHistoryDTO h : history) {
            Row row = historySheet.createRow(rowNum++);
            row.createCell(0).setCellValue(h.getMatricule());
            row.createCell(1).setCellValue(h.getNom());
            row.createCell(2).setCellValue(h.getPeriode());
            row.createCell(3).setCellValue(h.getNiveau());
            row.createCell(4).setCellValue(h.getEvolution());
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();

        return outputStream.toByteArray();
    }
}