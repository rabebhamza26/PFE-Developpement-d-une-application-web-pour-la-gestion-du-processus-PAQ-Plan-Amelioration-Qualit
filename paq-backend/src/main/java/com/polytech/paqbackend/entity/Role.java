package com.polytech.paqbackend.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import static com.polytech.paqbackend.entity.Permission.*;
@RequiredArgsConstructor
public enum Role {

    SL(Set.of(USER_READ)),

    QM_SEGMENT(Set.of(USER_READ, USER_UPDATE)),

    QM_PLANT(Set.of(USER_READ, USER_UPDATE)),

    SGL(Set.of(USER_READ)),

    HP(Set.of(USER_READ)),

    RH(Set.of(USER_READ, USER_UPDATE)),

    COORDINATEUR_FORMATION(Set.of(USER_READ)),

    ADMIN(Set.of(
            ADMIN_READ,
            ADMIN_CREATE,
            ADMIN_UPDATE,
            ADMIN_DELETE,
            USER_READ,
            USER_CREATE,
            USER_UPDATE,
            USER_DELETE
    ));

    @Getter
    private final Set<Permission> permissions;

    public List<String> getAuthorities() {
        List<String> perms = permissions.stream()
                .map(Permission::getPermission)
                .toList();

        return perms;
    }
}

