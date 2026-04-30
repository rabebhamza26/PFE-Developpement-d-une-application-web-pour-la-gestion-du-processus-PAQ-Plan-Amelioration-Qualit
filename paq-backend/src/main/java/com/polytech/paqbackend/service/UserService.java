// UserService.java - Version avec les nouveaux DTOs
package com.polytech.paqbackend.service;

import com.polytech.paqbackend.dto.CreateUserRequest;
import com.polytech.paqbackend.dto.UpdateUserRequest;
import com.polytech.paqbackend.dto.UserResponseDto;
import com.polytech.paqbackend.entity.*;
import com.polytech.paqbackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final SiteRepository siteRepository;
    private final PlantRepository plantRepository;
    private final SegmentRepository segmentRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAllWithAllRelations()
                .stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    public UserResponseDto getUserById(Long id) {
        return userRepository.findByIdWithAllRelations(id)
                .map(this::mapToResponseDto)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public UserResponseDto createUser(CreateUserRequest request) {
        User user = new User();
        user.setActive(true);
        user.setEmail(request.getEmail());
        user.setLogin(request.getLogin());
        user.setNomUtilisateur(request.getNomUtilisateur());
        user.setRole(request.getRole());

        // Encoder le mot de passe
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        } else {
            throw new RuntimeException("Password is required");
        }

        // Associer les sites
        if (request.getSiteIds() != null && !request.getSiteIds().isEmpty()) {
            Set<Site> sites = new HashSet<>(siteRepository.findAllById(request.getSiteIds()));
            user.setSites(sites);
        }

        // Associer les plants
        if (request.getPlantIds() != null && !request.getPlantIds().isEmpty()) {
            Set<Plant> plants = new HashSet<>(plantRepository.findAllById(request.getPlantIds()));
            user.setPlants(plants);
        }

        // Associer les segments
        if (request.getSegmentIds() != null && !request.getSegmentIds().isEmpty()) {
            Set<Segment> segments = new HashSet<>(segmentRepository.findAllById(request.getSegmentIds()));
            user.setSegments(segments);
        }

        return mapToResponseDto(userRepository.save(user));
    }

    @Transactional
    public UserResponseDto updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findByIdWithAllRelations(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Mise à jour des champs de base
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            User existing = userRepository.findByEmail(request.getEmail());
            if (existing != null && !existing.getId().equals(id)) {
                throw new RuntimeException("Email déjà utilisé");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getNomUtilisateur() != null) {
            user.setNomUtilisateur(request.getNomUtilisateur());
        }

        if (request.getLogin() != null) {
            user.setLogin(request.getLogin());
        }

        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }

        // Mise à jour du mot de passe si fourni
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        // Mise à jour des sites
        if (request.getSiteIds() != null) {
            Set<Site> sites = new HashSet<>(siteRepository.findAllById(request.getSiteIds()));
            user.setSites(sites);
        }

        // Mise à jour des plants
        if (request.getPlantIds() != null) {
            Set<Plant> plants = new HashSet<>(plantRepository.findAllById(request.getPlantIds()));
            user.setPlants(plants);
        }

        // Mise à jour des segments
        if (request.getSegmentIds() != null) {
            Set<Segment> segments = new HashSet<>(segmentRepository.findAllById(request.getSegmentIds()));
            user.setSegments(segments);
        }

        // Mise à jour du statut actif
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        return mapToResponseDto(userRepository.save(user));
    }

    public List<String> getAllEmails() {
        return userRepository.findAllEmails();
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
    }

    public UserResponseDto toggleActive(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(!user.isActive());
        return mapToResponseDto(userRepository.save(user));
    }

    private UserResponseDto mapToResponseDto(User user) {
        List<String> permissions = user.getRole().getAuthorities();

        return UserResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nomUtilisateur(user.getNomUtilisateur())
                .login(user.getLogin())
                .role(user.getRole())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .permissions(permissions)
                // Sites
                .siteIds(user.getSites().stream().map(Site::getId).collect(Collectors.toList()))
                .siteNames(user.getSites().stream().map(Site::getName).collect(Collectors.toList()))
                // Plants
                .plantIds(user.getPlants().stream().map(Plant::getId).collect(Collectors.toList()))
                .plantNames(user.getPlants().stream().map(Plant::getName).collect(Collectors.toList()))
                // Segments
                .segmentIds(user.getSegments().stream().map(Segment::getId).collect(Collectors.toList()))
                .segmentNames(user.getSegments().stream().map(Segment::getNomSegment).collect(Collectors.toList()))
                .build();
    }
}