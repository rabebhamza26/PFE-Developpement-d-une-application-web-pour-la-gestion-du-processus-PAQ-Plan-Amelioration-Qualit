package com.polytech.paqbackend.dto;



import java.time.LocalDate;
import java.util.List;

public class EnvoyerSlRequest {

        private String slDestinataire;
        private LocalDate dateEnvoi;
        private String message;
        private List<String> matricules;

        public String getSlDestinataire() { return slDestinataire; }
        public void setSlDestinataire(String slDestinataire) { this.slDestinataire = slDestinataire; }

        public LocalDate getDateEnvoi() { return dateEnvoi; }
        public void setDateEnvoi(LocalDate dateEnvoi) { this.dateEnvoi = dateEnvoi; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public List<String> getMatricules() { return matricules; }
        public void setMatricules(List<String> matricules) { this.matricules = matricules; }
    }
