package com.polytech.paqbackend.dto;

import com.polytech.paqbackend.entity.Role;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class UserResponseDto {
    private Long id;
    private String email;
    private String nomUtilisateur;
    private String login;
    private Role role;
    private boolean active;
    private LocalDateTime createdAt;
    private List<String> permissions;
    private List<Long> siteIds;
    private List<String> siteNames;
    private List<Long> plantIds;
    private List<String> plantNames;
    private List<Long> segmentIds;
    private List<String> segmentNames;
}