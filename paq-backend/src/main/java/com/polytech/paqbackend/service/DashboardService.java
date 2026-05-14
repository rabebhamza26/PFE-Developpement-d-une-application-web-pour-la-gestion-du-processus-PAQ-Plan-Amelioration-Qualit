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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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

    // =========================================================
    // Méthode utilitaire : récupère l'utilisateur connecté
    // =========================================================
    private User getCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()
                    || "anonymousUser".equals(auth.getPrincipal())) {
                return null;
            }
            String username = auth.getName();
            User user = userRepository.findByEmail(username);
            if (user == null) {
                user = userRepository.findByLogin(username);
            }
            return user;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    // =========================================================
    // Méthode utilitaire : segments accessibles pour un user
    // =========================================================
    private Set<String> getAccessibleSegments(User user) {
        Set<String> segments = new HashSet<>();
        if (user == null) return segments;

        // Segments directement assignés
        if (user.getSegments() != null) {
            user.getSegments().forEach(s -> {
                if (s != null && s.getNomSegment() != null) segments.add(s.getNomSegment());
            });
        }
        // Segments via les plants assignés
        if (user.getPlants() != null) {
            user.getPlants().forEach(p -> {
                if (p != null && p.getSegments() != null) {
                    p.getSegments().forEach(s -> {
                        if (s != null && s.getNomSegment() != null) segments.add(s.getNomSegment());
                    });
                }
            });
        }
        // Segments via les sites assignés
        if (user.getSites() != null) {
            user.getSites().forEach(site -> {
                if (site != null && site.getPlants() != null) {
                    site.getPlants().forEach(p -> {
                        if (p != null && p.getSegments() != null) {
                            p.getSegments().forEach(s -> {
                                if (s != null && s.getNomSegment() != null) segments.add(s.getNomSegment());
                            });
                        }
                    });
                }
            });
        }
        return segments;
    }

    // =========================================================
    // Stats principales
    // =========================================================
    public DashboardStatsDTO getStats(Long siteId, Long plantId) {
        DashboardStatsDTO dto = new DashboardStatsDTO();

        List<CollaborateurDTO> filteredDTOs   = getFilteredCollaboratorDTOs(siteId, plantId);
        List<Collaborator>     filteredCollabs = getFilteredCollaborators(siteId, plantId);
        List<PaqDossier>       filteredPaqs   = getFilteredPaqs(siteId, plantId);

        // Total collaborateurs dans le périmètre
        dto.setTotalCollaborateurs((long) filteredCollabs.size());
        dto.setTotalPaqs(filteredPaqs.size());

        // PAQ actifs (non clôturés / non archivés)
        long paqActifs = filteredPaqs.stream()
                .filter(p -> !"CLOTURE".equals(p.getStatut()) && !"ARCHIVE".equals(p.getStatut()))
                .count();
        dto.setPaqEnCours((int) paqActifs);

        // Répartition par niveau
        Map<Integer, Long> paqParNiveau = filteredPaqs.stream()
                .collect(Collectors.groupingBy(PaqDossier::getNiveau, Collectors.counting()));
        dto.setPaqParNiveau(paqParNiveau);

        // Collaborateurs sans faute dans le périmètre
        List<CollaborateurDTO> sansFaute = filteredDTOs.stream()
                .filter(c -> c.getNiveau() == 0 || "POSITIF".equals(c.getStatut()))
                .collect(Collectors.toList());
        dto.setSansFaute(sansFaute);

        // Stats utilisateurs — globales (non filtrées par site/plant)
        long totalUsers       = userRepository.count();
        long activeUsers      = userRepository.countByActiveTrue();
        long inactiveUsers    = userRepository.countByActiveFalse();
        dto.setTotalUsers(totalUsers);
        dto.setActiveUsers(activeUsers);
        dto.setInactiveUsers(inactiveUsers);

        LocalDateTime startOfMonth = LocalDateTime.now()
                .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        dto.setNewUsersThisMonth(userRepository.countByCreatedAtAfter(startOfMonth));

        long newPaqsThisMonth = filteredPaqs.stream()
                .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().isAfter(startOfMonth))
                .count();
        dto.setNewPaqsThisMonth(newPaqsThisMonth);

        long activeCollaborators = filteredCollabs.stream()
                .filter(c -> c.isActif() && !c.isDepart())
                .count();
        dto.setActiveCollaborators(activeCollaborators);

        List<Object[]> roleCountsResult = userRepository.countUsersByRole();
        Map<String, Long> roleCounts = new HashMap<>();
        for (Object[] result : roleCountsResult) {
            roleCounts.put(result[0].toString(), (Long) result[1]);
        }
        dto.setRoleCounts(roleCounts);

        return dto;
    }

    // =========================================================
    // Statistiques par segment
    // =========================================================
    public List<SegmentStatsDTO> getSegmentStats(Long siteId, Long plantId) {
        List<Collaborator> collaborateurs = getFilteredCollaborators(siteId, plantId);
        List<PaqDossier>   paqs          = getFilteredPaqs(siteId, plantId);

        Map<String, List<Collaborator>> grouped = collaborateurs.stream()
                .filter(c -> c.getSegment() != null && !c.getSegment().isEmpty())
                .collect(Collectors.groupingBy(Collaborator::getSegment));

        List<SegmentStatsDTO> result = new ArrayList<>();

        for (Map.Entry<String, List<Collaborator>> entry : grouped.entrySet()) {
            String segment = entry.getKey();
            List<Collaborator> collabs = entry.getValue();
            long total = collabs.size();

            Map<Integer, Long> niveaux = new HashMap<>();
            for (int i = 1; i <= 5; i++) niveaux.put(i, 0L);

            for (Collaborator c : collabs) {
                paqs.stream()
                        .filter(p -> p.getCollaboratorMatricule().equals(c.getMatricule())
                                && p.isActif() && !p.isArchived())
                        .findFirst()
                        .ifPresent(paq -> {
                            int n = paq.getNiveau();
                            niveaux.put(n, niveaux.getOrDefault(n, 0L) + 1);
                        });
            }

            long sansFaute = collabs.stream()
                    .filter(c -> paqs.stream()
                            .noneMatch(p -> p.getCollaboratorMatricule().equals(c.getMatricule())
                                    && p.isActif()))
                    .count();

            result.add(new SegmentStatsDTO(
                    segment, total,
                    niveaux.getOrDefault(1, 0L),
                    niveaux.getOrDefault(2, 0L),
                    niveaux.getOrDefault(3, 0L),
                    niveaux.getOrDefault(4, 0L),
                    niveaux.getOrDefault(5, 0L),
                    sansFaute
            ));
        }

        result.sort((a, b) -> Long.compare(b.getTotalCollaborateurs(), a.getTotalCollaborateurs()));
        return result;
    }

    // =========================================================
    // Historique de performance
    // =========================================================
    public List<PerformanceHistoryDTO> getPerformanceHistory(Long siteId, Long plantId) {
        List<PaqDossier> paqs = getFilteredPaqs(siteId, plantId);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/yyyy");

        Map<String, List<PaqDossier>> groupedByPeriod = paqs.stream()
                .filter(p -> p.getCreatedAt() != null)
                .collect(Collectors.groupingBy(p -> p.getCreatedAt().format(formatter)));

        List<String> sortedPeriods = new ArrayList<>(groupedByPeriod.keySet());
        sortedPeriods.sort((a, b) -> {
            String[] aParts = a.split("/");
            String[] bParts = b.split("/");
            int aYear = Integer.parseInt(aParts[1]);
            int bYear = Integer.parseInt(bParts[1]);
            if (aYear != bYear) return Integer.compare(aYear, bYear);
            return Integer.compare(Integer.parseInt(aParts[0]), Integer.parseInt(bParts[0]));
        });

        List<PerformanceHistoryDTO> result = new ArrayList<>();
        for (String periode : sortedPeriods) {
            List<PaqDossier> paqsOfPeriod = groupedByPeriod.get(periode);
            long amelioration = 0, stagnation = 0, regression = 0;
            for (PaqDossier paq : paqsOfPeriod) {
                if (paq.getNiveau() <= 1) amelioration++;
                else if (paq.getNiveau() == 2) stagnation++;
                else regression++;
            }
            result.add(new PerformanceHistoryDTO(
                    "aggregated_" + periode,
                    "Période " + periode,
                    periode,
                    0,
                    getEvolutionType(amelioration, stagnation, regression)
            ));
        }
        return result;
    }

    private String getEvolutionType(long amelioration, long stagnation, long regression) {
        if (amelioration >= stagnation && amelioration >= regression) return "AMELIORATION";
        if (stagnation >= amelioration && stagnation >= regression) return "STAGNATION";
        return "REGRESSION";
    }

    // =========================================================
    // Helpers de filtrage — CORRIGÉS
    // =========================================================

    /**
     * Retourne les collaborateurs filtrés par :
     * 1. Le périmètre du user connecté (sites/plants/segments assignés au compte)
     * 2. Puis affinés par siteId ou plantId si fournis dans la requête.
     *
     * Pour les ADMIN, le périmètre est global ; les params siteId/plantId
     * permettent quand même de filtrer l'affichage.
     */
    private List<CollaborateurDTO> getFilteredCollaboratorDTOs(Long siteId, Long plantId) {
        User currentUser = getCurrentUser();

        // ✅ Cas ADMIN : peut tout voir, on filtre seulement par site/plant si précisé
        if (currentUser != null && "ADMIN".equals(currentUser.getRole().name())) {
            if (plantId != null) {
                return collaboratorRepository.getCollaboratorsByPlants(List.of(plantId));
            } else if (siteId != null) {
                return collaboratorRepository.getCollaboratorsBySites(List.of(siteId));
            }
            return collaboratorRepository.getAllWithPaq();
        }

        // ✅ Autres rôles : périmètre restreint aux segments/plants/sites assignés
        if (currentUser != null) {
            // Priorité : plant sélectionné ET dans les plants du user
            if (plantId != null) {
                boolean plantAllowed = currentUser.getPlants() != null
                        && currentUser.getPlants().stream().anyMatch(p -> p.getId().equals(plantId));
                if (plantAllowed) {
                    return collaboratorRepository.getCollaboratorsByPlants(List.of(plantId));
                }
                // Plant demandé non autorisé → liste vide
                return new ArrayList<>();
            }

            // Site sélectionné ET dans les sites du user
            if (siteId != null) {
                boolean siteAllowed = currentUser.getSites() != null
                        && currentUser.getSites().stream().anyMatch(s -> s.getId().equals(siteId));
                if (siteAllowed) {
                    return collaboratorRepository.getCollaboratorsBySites(List.of(siteId));
                }
                return new ArrayList<>();
            }

            // Pas de filtre site/plant : retourner tout le périmètre segments du user
            Set<String> accessibleSegments = getAccessibleSegments(currentUser);
            if (accessibleSegments.isEmpty()) return new ArrayList<>();
            return collaboratorRepository.getCollaboratorsBySegments(
                    new ArrayList<>(accessibleSegments));
        }

        return new ArrayList<>();
    }

    /**
     * Retourne les entités Collaborator filtrées selon le même principe.
     * Utilisé pour les calculs internes (actif, depart…).
     */
    private List<Collaborator> getFilteredCollaborators(Long siteId, Long plantId) {
        // On réutilise les DTOs pour obtenir les matricules filtrés,
        // puis on charge les entités complètes correspondantes.
        List<CollaborateurDTO> dtos = getFilteredCollaboratorDTOs(siteId, plantId);
        Set<String> matricules = dtos.stream()
                .map(CollaborateurDTO::getMatricule)
                .collect(Collectors.toSet());

        if (matricules.isEmpty()) return new ArrayList<>();

        return collaboratorRepository.findByDepartFalseAndArchivedFalse().stream()
                .filter(c -> matricules.contains(c.getMatricule()))
                .collect(Collectors.toList());
    }

    /**
     * Retourne les PAQ des collaborateurs du périmètre filtré.
     */
    private List<PaqDossier> getFilteredPaqs(Long siteId, Long plantId) {
        // Récupérer les matricules autorisés
        List<CollaborateurDTO> dtos = getFilteredCollaboratorDTOs(siteId, plantId);
        Set<String> matricules = dtos.stream()
                .map(CollaborateurDTO::getMatricule)
                .collect(Collectors.toSet());

        if (matricules.isEmpty()) return new ArrayList<>();

        // Charger tous les PAQ non archivés et filtrer par matricule autorisé
        return paqRepository.findAll().stream()
                .filter(p -> !p.isArchived() && matricules.contains(p.getCollaboratorMatricule()))
                .collect(Collectors.toList());
    }
}