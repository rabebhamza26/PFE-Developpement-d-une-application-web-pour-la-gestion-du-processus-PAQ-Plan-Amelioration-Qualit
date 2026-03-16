package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.entity.User;
import com.polytech.paqbackend.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import com.polytech.paqbackend.entity.LoginRequest;

import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5177")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        User user = userRepository.findByLogin(request.getLogin());

        if (user == null || !user.getPassword().equals(request.getPassword())) {
            return ResponseEntity.status(401).body("INVALID_CREDENTIALS");
        }

        return ResponseEntity.ok(user.getRole().name());
    }
}
