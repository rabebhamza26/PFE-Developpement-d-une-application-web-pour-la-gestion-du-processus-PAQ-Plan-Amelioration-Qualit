package com.polytech.paqbackend.service;



import com.polytech.paqbackend.entity.Collaborator;
import com.polytech.paqbackend.entity.PaqDossier;

import com.polytech.paqbackend.repository.CollaboratorRepository;
import com.polytech.paqbackend.repository.PaqRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class PaqSchedulerService {

    @Autowired
    private CollaboratorRepository collaboratorRepository;

    @Autowired
    private PaqRepository paqRepository;

    // Vérifie chaque jour


            @Scheduled(cron = "0 0 2 * * ?") // Tous les jours à 2h00
            public void createPaqAfterSixMonths() {
                List<Collaborator> collaborators = collaboratorRepository.findAll();

                for (Collaborator collab : collaborators) {
                    LocalDate hireDate = collab.getHireDate();

                    if (hireDate == null) continue;

                    long months = ChronoUnit.MONTHS.between(hireDate, LocalDate.now());

                    if (months >= 6) {
                        Optional<PaqDossier> existing = paqRepository.findByCollaboratorMatricule(collab.getMatricule());

                        if (existing.isEmpty()) {
                            PaqDossier paq = new PaqDossier();
                            paq.setCollaboratorMatricule(collab.getMatricule()); // String
                            paq.setCreatedAt(LocalDate.now().atStartOfDay());                            paq.setNiveau(1);

                            paq.setHistorique("""
                        [
                          {
                            "date": "%s",
                            "action": "Création dossier PAQ",
                            "detail": "Dossier généré automatiquement après 6 mois"
                          }
                        ]
                    """.formatted(LocalDate.now()));

                            paqRepository.save(paq);
                            System.out.println("PAQ créé pour : " + collab.getMatricule());
                        }
                    }
                }
            }
        }

