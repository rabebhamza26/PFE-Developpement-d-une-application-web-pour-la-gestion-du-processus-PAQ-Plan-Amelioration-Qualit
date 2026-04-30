package com.polytech.paqbackend.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class LoginResponse {
    private Long userId;
    private String fullName;
    private String role;
    private String siteName;
    private String plantName;

    // ✅ Tokens JWT ajoutés
    @JsonProperty("access_token")
    private String accessToken;

    @JsonProperty("refresh_token")
    private String refreshToken;
}