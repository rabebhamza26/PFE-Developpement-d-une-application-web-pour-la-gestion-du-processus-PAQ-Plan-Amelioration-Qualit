package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.entity.*;
import com.polytech.paqbackend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        User user = userRepository.findByLogin(request.getLogin());

        // Vérification utilisateur
        if (user == null || !user.getPassword().equals(request.getPassword())) {
            return ResponseEntity.status(401).body(
                    new ErrorResponse("INVALID_CREDENTIALS", "Identifiants incorrects")
            );
        }

        // Vérifier si actif
        if (!user.isActive()) {
            return ResponseEntity.status(403).body(
                    new ErrorResponse("USER_DISABLED", "Compte désactivé")
            );
        }

        // Réponse corrigée
        LoginResponse response = new LoginResponse(
                user.getId(),
                user.getNomUtilisateur(), // ✔️ correction ici
                user.getRole().name(),
                request.getSiteName(),
                request.getPlantName()
        );

        return ResponseEntity.ok(response);
    }
}