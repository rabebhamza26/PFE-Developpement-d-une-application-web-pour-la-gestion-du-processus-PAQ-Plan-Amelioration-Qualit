package com.polytech.paqbackend.service;

import com.polytech.paqbackend.dto.DashboardStatsDTO;
import com.polytech.paqbackend.dto.SegmentStatsDTO;
import com.polytech.paqbackend.dto.PerformanceHistoryDTO;
import com.polytech.paqbackend.dto.CollaborateurDTO;
import com.polytech.paqbackend.entity.Collaborator;
import com.polytech.paqbackend.entity.PaqDossier;
import com.polytech.paqbackend.repository.CollaboratorRepository;
import com.polytech.paqbackend.repository.PaqRepository;
import com.polytech.paqbackend.repository.SegmentRepository;
import com.polytech.paqbackend.repository.UserRepository;

import com.polytech.paqbackend.entity.Segment;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private PaqRepository paqRepository;

    @Autowired
    private CollaboratorRepository collaboratorRepository;

    public DashboardStatsDTO getStats() {

        DashboardStatsDTO dto = new DashboardStatsDTO();

        // Total collaborateurs
        dto.setTotalCollaborateurs(collaboratorRepository.count());

        // Tous les PAQ
        List<PaqDossier> paqs = paqRepository.findAll();

        dto.setTotalPaqs(paqs.size());

        // PAQ en cours



        List<PaqDossier> paq = paqRepository.findAll();

        List<PaqDossier> paqActifs = paqs.stream()
                .filter(p -> !"CLOTURE".equals(p.getStatut()) && !"ARCHIVE".equals(p.getStatut()))
                .collect(Collectors.toList());
        // Répartition par niveau
        Map<Integer, Long> paqParNiveau = paqs.stream()
                .collect(Collectors.groupingBy(
                        PaqDossier::getNiveau,
                        Collectors.counting()
                ));

        dto.setPaqParNiveau(paqParNiveau);

        List<CollaborateurDTO> sansFaute = collaboratorRepository.findSansFaute();
        dto.setSansFaute(sansFaute);

        return dto;
    }

    public List<SegmentStatsDTO> getSegmentStats() {

        List<Collaborator> collaborateurs = collaboratorRepository.findAll();
        List<PaqDossier> paqs = paqRepository.findAll();

        Map<String, List<Collaborator>> grouped =
                collaborateurs.stream().collect(Collectors.groupingBy(Collaborator::getSegment));

        List<SegmentStatsDTO> result = new ArrayList<>();

        for (String segment : grouped.keySet()) {

            List<Collaborator> collabs = grouped.get(segment);

            long total = collabs.size();

            Map<Integer, Long> niveaux = paqs.stream()
                    .filter(p -> collabs.stream()
                            .anyMatch(c -> c.getMatricule().equals(p.getCollaboratorMatricule())))
                    .collect(Collectors.groupingBy(
                            PaqDossier::getNiveau,
                            Collectors.counting()
                    ));

            long sansFaute = collabs.stream()
                    .filter(c -> paqs.stream()
                            .noneMatch(p -> p.getCollaboratorMatricule().equals(c.getMatricule())))
                    .count();

            result.add(new SegmentStatsDTO(
                    segment,
                    total,
                    niveaux.getOrDefault(1, 0L),
                    niveaux.getOrDefault(2, 0L),
                    niveaux.getOrDefault(3, 0L),
                    niveaux.getOrDefault(4, 0L),
                    niveaux.getOrDefault(5, 0L),
                    sansFaute
            ));
        }

        return result;
    }

    public List<PerformanceHistoryDTO> getPerformanceHistory() {

        List<PaqDossier> paqs = paqRepository.findAll();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/yyyy");

        return paqs.stream().map(p -> {

            String evolution;

            if (p.getNiveau() <= 1) {
                evolution = "AMELIORATION";
            } else if (p.getNiveau() == 2) {
                evolution = "STAGNATION";
            } else {
                evolution = "REGRESSION";
            }

            return new PerformanceHistoryDTO(
                    p.getCollaboratorMatricule(),
                    p.getCollaboratorMatricule(), // pas de nom → on met matricule
                    p.getCreatedAt() != null ? p.getCreatedAt().format(formatter) : "N/A",
                    p.getNiveau(),
                    evolution
            );

        }).collect(Collectors.toList());
    }
}
