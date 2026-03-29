package com.polytech.paqbackend.service;



import com.polytech.paqbackend.entity.PaqDossier;
import com.polytech.paqbackend.repository.PaqRepository;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ArchivingService {

    private final PaqRepository paqRepository;

    public ArchivingService(PaqRepository paqRepository) {
        this.paqRepository = paqRepository;
    }

    @Scheduled(cron = "0 0 2 * * ?") // Tous les jours à 2h du matin
    @Transactional
    public void archiveOldPaqs() {
        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6);

        // FIX: Use the correct method name that exists in your repository
        List<PaqDossier> oldPaqs = paqRepository.findOldPaqsNotArchived(sixMonthsAgo, "ARCHIVE");

        for (PaqDossier paq : oldPaqs) {
            paq.setStatut("ARCHIVE");
            paq.setArchived(true);
            paq.setActif(false);
            paqRepository.save(paq);
        }

        System.out.println("Archivé " + oldPaqs.size() + " dossiers PAQ de plus de 6 mois");
    }
}