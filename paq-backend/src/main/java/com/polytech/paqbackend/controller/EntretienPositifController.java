package com.polytech.paqbackend.controller;


import com.polytech.paqbackend.dto.CollaborateurSansFauteDto;
import com.polytech.paqbackend.dto.EnvoyerSlRequest;
import com.polytech.paqbackend.dto.ValiderEntretienPositifRequest;
import com.polytech.paqbackend.entity.Collaborator;
import com.polytech.paqbackend.service.EntretienPositifService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

        import java.util.List;

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

        @PostMapping("/archiver-et-creer")
        public ResponseEntity<?> validerEntretienPositif(@RequestBody ValiderEntretienPositifRequest request) {
            return ResponseEntity.ok(entretienPositifService.archiverEtCreerNouveauPaq(request));
        }
    }

