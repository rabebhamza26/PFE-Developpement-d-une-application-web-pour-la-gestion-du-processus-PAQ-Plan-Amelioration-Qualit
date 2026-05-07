// User.java - Version corrigée avec toutes les relations
package com.polytech.paqbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.polytech.paqbackend.token.Token;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "user")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String email;

    private String nomUtilisateur;

    @Column(unique = true)
    private String login;

    private String password;

    private boolean active = true;

    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    private Role role;



    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_site",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "site_id"))
    private Set<Site> sites = new HashSet<>();

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_plant",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "plant_id"))
    private Set<Plant> plants = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_segment",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "segment_id"))
    private Set<Segment> segments = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Token> tokens;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }

    @Override
    public String getUsername() { return login; }

    @Override
    public String getPassword() { return password; }

    /**
     * Retourne ROLE_XXX + toutes les permissions granulaires du rôle.
     * Spring Security utilise ces authorities pour @PreAuthorize("hasAuthority('xxx:read')").
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return role.getGrantedAuthorities();
    }

    @Override public boolean isAccountNonExpired()     { return true;   }
    @Override public boolean isAccountNonLocked()      { return active; }
    @Override public boolean isCredentialsNonExpired() { return true;   }
    @Override public boolean isEnabled()               { return active; }
}
