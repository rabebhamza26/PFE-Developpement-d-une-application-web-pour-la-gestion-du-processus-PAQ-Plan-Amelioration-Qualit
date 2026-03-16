package com.polytech.paqbackend.service;

import com.polytech.paqbackend.entity.Collaborator;
import com.polytech.paqbackend.entity.PaqDossier;
import com.polytech.paqbackend.repository.CollaboratorRepository;
import com.polytech.paqbackend.repository.PaqRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class CollaboratorService {

    @Autowired
    private CollaboratorRepository collaboratorRepository;

    @Autowired
    private PaqRepository paqRepository;

    public Collaborator create(Collaborator collaborator){

        collaborator.setNiveau(0);
        collaborator.setStatus("ACTIF");

        Collaborator saved = collaboratorRepository.save(collaborator);

        if(collaborator.getHireDate().plusMonths(6).isBefore(LocalDate.now())){

            PaqDossier paq = new PaqDossier();

            paq.setCollaboratorMatricule(saved.getMatricule());
            paq.setCreatedAt(LocalDate.now().atStartOfDay());
            paq.setNiveau(0);

            paq.setHistorique("""
            [
              {"date":"%s","action":"Création du dossier PAQ","detail":"Créé automatiquement"}
            ]
            """.formatted(LocalDate.now()));

            paqRepository.save(paq);

        }

        return saved;
    }
}