package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.DashboardStatsDTO;
import com.polytech.paqbackend.dto.SegmentStatsDTO;
import com.polytech.paqbackend.dto.PerformanceHistoryDTO;
import com.polytech.paqbackend.service.DashboardService;
import com.polytech.paqbackend.service.ExportService;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final ExportService exportService;

    public DashboardController(DashboardService dashboardService, ExportService exportService) {
        this.dashboardService = dashboardService;
        this.exportService = exportService;
    }

    @GetMapping("/stats")
    public DashboardStatsDTO getStats() {
        return dashboardService.getStats();
    }

    @GetMapping("/segment-stats")
    public List<SegmentStatsDTO> getSegmentStats() {
        return dashboardService.getSegmentStats();
    }

    @GetMapping("/performance-history")
    public List<PerformanceHistoryDTO> getPerformanceHistory() {
        return dashboardService.getPerformanceHistory();
    }

    @GetMapping("/export/{format}")
    public ResponseEntity<byte[]> exportReport(@PathVariable String format) {
        try {
            byte[] reportData;
            String filename;
            String contentType;

            if ("pdf".equalsIgnoreCase(format)) {
                reportData = exportService.generatePdfReport();
                filename = "rapport-semestriel.pdf";
                contentType = MediaType.APPLICATION_PDF_VALUE;
            } else if ("excel".equalsIgnoreCase(format)) {
                reportData = exportService.generateExcelReport();
                filename = "rapport-semestriel.xlsx";
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            } else {
                throw new IllegalArgumentException("Format non supporté: " + format);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(reportData.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(reportData);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}