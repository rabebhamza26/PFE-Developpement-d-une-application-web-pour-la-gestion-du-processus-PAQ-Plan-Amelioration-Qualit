package com.polytech.paqbackend.entity;

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
}