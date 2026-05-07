package com.polytech.paqbackend.dto;

import lombok.Data;

@Data
    public class ForgotPasswordRequest {
        private String email;
        private String login;
    }

