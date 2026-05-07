package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.ForgotPasswordRequest;
import com.polytech.paqbackend.dto.ForgotPasswordResponse;
import com.polytech.paqbackend.service.ForgotPasswordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class ForgotPasswordController {

    private final ForgotPasswordService forgotPasswordService;

    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(
            @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(forgotPasswordService.processForgotPassword(request));
    }

    @PatchMapping("/users/{id}/reset-password-admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ForgotPasswordResponse> resetPasswordByAdmin(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String newPassword = payload.get("newPassword");
        return ResponseEntity.ok(forgotPasswordService.resetPassword(id, newPassword));
    }
}