package com.polytech.paqbackend.dto;

import com.polytech.paqbackend.entity.Role;
import lombok.Data;
import java.util.List;

@Data
public class UpdateUserRequest {
    private String email;
    private String nomUtilisateur;
    private String login;
    private String password;
    private Role role;
    private Boolean active;
    private List<Long> siteIds;
    private List<Long> plantIds;
    private List<Long> segmentIds;
}
