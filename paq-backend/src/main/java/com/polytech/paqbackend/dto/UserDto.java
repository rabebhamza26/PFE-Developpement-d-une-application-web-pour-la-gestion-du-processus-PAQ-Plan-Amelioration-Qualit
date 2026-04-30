// UserDto.java - Version corrigée avec annotations Jackson
package com.polytech.paqbackend.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.polytech.paqbackend.entity.Role;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String email;
    private String nomUtilisateur;
    private String login;
    private String password;
    private Role role;
    private boolean active;
    private LocalDateTime createdAt;
    private List<String> permissions;

    // Relations multiples
    private List<Long> siteIds;
    private List<String> siteNames;
    private List<Long> plantIds;
    private List<String> plantNames;
    private List<Long> segmentIds;
    private List<String> segmentNames;
}