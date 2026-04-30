package com.polytech.paqbackend.dto;

import com.polytech.paqbackend.entity.Role;
import lombok.Data;
import java.util.List;

@Data
public class CreateUserRequest {
    private String email;
    private String nomUtilisateur;
    private String login;
    private String password;
    private Role role;
    private boolean active;
    private List<Long> siteIds;
    private List<Long> plantIds;
    private List<Long> segmentIds;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNomUtilisateur() {
        return nomUtilisateur;
    }

    public void setNomUtilisateur(String nomUtilisateur) {
        this.nomUtilisateur = nomUtilisateur;
    }

    public String getLogin() {
        return login;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public List<Long> getSiteIds() {
        return siteIds;
    }

    public void setSiteIds(List<Long> siteIds) {
        this.siteIds = siteIds;
    }

    public List<Long> getPlantIds() {
        return plantIds;
    }

    public void setPlantIds(List<Long> plantIds) {
        this.plantIds = plantIds;
    }

    public List<Long> getSegmentIds() {
        return segmentIds;
    }

    public void setSegmentIds(List<Long> segmentIds) {
        this.segmentIds = segmentIds;
    }
}
