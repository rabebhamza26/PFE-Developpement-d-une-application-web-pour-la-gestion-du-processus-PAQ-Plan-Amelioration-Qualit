package com.polytech.paqbackend.service;

import com.polytech.paqbackend.dto.DashboardStatsDTO;
import com.polytech.paqbackend.dto.SegmentStatsDTO;
import com.polytech.paqbackend.dto.PerformanceHistoryDTO;
import com.polytech.paqbackend.dto.CollaborateurDTO;
import com.polytech.paqbackend.entity.Collaborator;
import com.polytech.paqbackend.entity.PaqDossier;
import com.polytech.paqbackend.entity.User;
import com.polytech.paqbackend.repository.CollaboratorRepository;
import com.polytech.paqbackend.repository.PaqRepository;
import com.polytech.paqbackend.repository.UserRepository;

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

    @Autowired
    private UserRepository userRepository;

    public DashboardStatsDTO getStats() {
        DashboardStatsDTO dto = new DashboardStatsDTO();

        // Total collaborateurs
        long totalCollaborateurs = collaboratorRepository.count();
        dto.setTotalCollaborateurs(totalCollaborateurs);

        // Tous les PAQ
        List<PaqDossier> paqs = paqRepository.findAll();
        dto.setTotalPaqs(paqs.size());

        // PAQ en cours (non clôturés et non archivés)
        List<PaqDossier> paqActifs = paqs.stream()
                .filter(p -> !"CLOTURE".equals(p.getStatut()) && !"ARCHIVE".equals(p.getStatut()))
                .collect(Collectors.toList());
        dto.setPaqEnCours(paqActifs.size());

        // Répartition par niveau
        Map<Integer, Long> paqParNiveau = paqs.stream()
                .collect(Collectors.groupingBy(
                        PaqDossier::getNiveau,
                        Collectors.counting()
                ));
        dto.setPaqParNiveau(paqParNiveau);

        // Collaborateurs sans faute
        List<CollaborateurDTO> sansFaute = collaboratorRepository.findSansFaute();
        dto.setSansFaute(sansFaute);

        // Statistiques utilisateurs
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByActiveTrue();
        long inactiveUsers = userRepository.countByActiveFalse();

        dto.setTotalUsers(totalUsers);
        dto.setActiveUsers(activeUsers);
        dto.setInactiveUsers(inactiveUsers);

        // Nouveaux utilisateurs ce mois-ci
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        long newUsersThisMonth = userRepository.countByCreatedAtAfter(startOfMonth);
        dto.setNewUsersThisMonth(newUsersThisMonth);

        // Nouveaux PAQ ce mois-ci
        long newPaqsThisMonth = paqs.stream()
                .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().isAfter(startOfMonth))
                .count();
        dto.setNewPaqsThisMonth(newPaqsThisMonth);

        // Collaborateurs actifs (avec PAQ en cours)
        long activeCollaborators = collaboratorRepository.findAll().stream()
                .filter(c -> c.isActif() && !c.isDepart())
                .count();
        dto.setActiveCollaborators(activeCollaborators);

        // Statistiques par rôle
        List<Object[]> roleCountsResult = userRepository.countUsersByRole();
        Map<String, Long> roleCounts = new HashMap<>();
        for (Object[] result : roleCountsResult) {
            String role = result[0].toString();
            Long count = (Long) result[1];
            roleCounts.put(role, count);
        }
        dto.setRoleCounts(roleCounts);

        return dto;
    }

    public List<SegmentStatsDTO> getSegmentStats() {
        List<Collaborator> collaborateurs = collaboratorRepository.findAll();
        List<PaqDossier> paqs = paqRepository.findAll();

        Map<String, List<Collaborator>> grouped = collaborateurs.stream()
                .filter(c -> c.getSegment() != null)
                .collect(Collectors.groupingBy(Collaborator::getSegment));

        List<SegmentStatsDTO> result = new ArrayList<>();

        for (Map.Entry<String, List<Collaborator>> entry : grouped.entrySet()) {
            String segment = entry.getKey();
            List<Collaborator> collabs = entry.getValue();

            long total = collabs.size();

            Map<Integer, Long> niveaux = new HashMap<>();
            for (int i = 1; i <= 5; i++) {
                niveaux.put(i, 0L);
            }

            for (Collaborator c : collabs) {
                PaqDossier paq = paqs.stream()
                        .filter(p -> p.getCollaboratorMatricule().equals(c.getMatricule()) && p.isActif() && !p.isArchived())
                        .findFirst()
                        .orElse(null);
                if (paq != null) {
                    int niveau = paq.getNiveau();
                    niveaux.put(niveau, niveaux.getOrDefault(niveau, 0L) + 1);
                }
            }

            long sansFaute = collabs.stream()
                    .filter(c -> paqs.stream()
                            .noneMatch(p -> p.getCollaboratorMatricule().equals(c.getMatricule()) && p.isActif()))
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

        // Grouper par période (mois/année)
        Map<String, List<PaqDossier>> groupedByPeriod = paqs.stream()
                .filter(p -> p.getCreatedAt() != null)
                .collect(Collectors.groupingBy(p -> p.getCreatedAt().format(formatter)));

        List<PerformanceHistoryDTO> result = new ArrayList<>();

        for (Map.Entry<String, List<PaqDossier>> entry : groupedByPeriod.entrySet()) {
            String periode = entry.getKey();
            List<PaqDossier> paqsOfPeriod = entry.getValue();

            for (PaqDossier paq : paqsOfPeriod) {
                String evolution;
                if (paq.getNiveau() <= 1) {
                    evolution = "AMELIORATION";
                } else if (paq.getNiveau() == 2) {
                    evolution = "STAGNATION";
                } else {
                    evolution = "REGRESSION";
                }

                result.add(new PerformanceHistoryDTO(
                        paq.getCollaboratorMatricule(),
                        getCollaboratorName(paq.getCollaboratorMatricule()),
                        periode,
                        paq.getNiveau(),
                        evolution
                ));
            }
        }

        // Trier par période
        result.sort((a, b) -> {
            String[] aParts = a.getPeriode().split("/");
            String[] bParts = b.getPeriode().split("/");
            int aMonth = Integer.parseInt(aParts[0]);
            int aYear = Integer.parseInt(aParts[1]);
            int bMonth = Integer.parseInt(bParts[0]);
            int bYear = Integer.parseInt(bParts[1]);
            if (aYear != bYear) return Integer.compare(aYear, bYear);
            return Integer.compare(aMonth, bMonth);
        });

        return result;
    }

    private String getCollaboratorName(String matricule) {
        return collaboratorRepository.findByMatricule(matricule)
                .map(c -> c.getName() + " " + c.getPrenom())
                .orElse(matricule);
    }
}