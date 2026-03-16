package com.polytech.paqbackend.service;

import com.polytech.paqbackend.dto.DashboardStatsDTO;
import com.polytech.paqbackend.repository.CollaboratorRepository;
import com.polytech.paqbackend.repository.PaqRepository;
import com.polytech.paqbackend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final PaqRepository paqRepository;
    private final CollaboratorRepository collaboratorRepository;

    public DashboardService(UserRepository userRepository,
                            PaqRepository paqRepository,
                            CollaboratorRepository collaboratorRepository) {
        this.userRepository = userRepository;
        this.paqRepository = paqRepository;
        this.collaboratorRepository = collaboratorRepository;
    }

    public DashboardStatsDTO getStats() {
        DashboardStatsDTO stats = new DashboardStatsDTO();

        // Totaux
        stats.setTotalUsers(userRepository.count());
        stats.setTotalPaqs(paqRepository.count());
        stats.setTotalCollaborators(collaboratorRepository.count());

        // Actifs (adapter selon ton modèle)
        stats.setActiveUsers(userRepository.countByActiveTrue());
        stats.setActiveCollaborators(collaboratorRepository.countByActifTrue());

        // Ce mois (adapter selon le champ date)
        LocalDateTime startOfMonth = LocalDate.now()
                .withDayOfMonth(1)   // premier jour du mois
                .atStartOfDay();     // convertit en LocalDateTime à 00:00

        stats.setNewUsersThisMonth(userRepository.countByCreatedAtAfter(startOfMonth));
        stats.setNewPaqsThisMonth(paqRepository.countByCreatedAtAfter(startOfMonth));
        return stats;
    }
}
