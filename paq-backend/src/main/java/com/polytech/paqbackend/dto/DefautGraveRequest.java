package com.polytech.paqbackend.dto;

import lombok.Data;

@Data
public class DefautGraveRequest {
    private String matricule;        // matricule du collaborateur concerné
    private String descriptionDefaut; // description du défaut grave
    private String sglEmail;         // email du SGL à notifier (optionnel, peut être cherché automatiquement)
}
