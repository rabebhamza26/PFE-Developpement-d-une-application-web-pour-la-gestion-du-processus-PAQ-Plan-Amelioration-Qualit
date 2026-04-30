// UserController.java - Version avec DTOs séparés
package com.polytech.paqbackend.controller;

import com.polytech.paqbackend.dto.CreateUserRequest;
import com.polytech.paqbackend.dto.UpdateUserRequest;
import com.polytech.paqbackend.dto.UserResponseDto;
import com.polytech.paqbackend.entity.User;
import com.polytech.paqbackend.repository.UserRepository;
import com.polytech.paqbackend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository userRepository;
    private final UserService userService;

    public UserController(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @GetMapping("/basic")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserResponseDto>> getAllUsersBasic() {
        List<User> users = userRepository.findAll();
        List<UserResponseDto> result = users.stream()
                .map(u -> UserResponseDto.builder()
                        .id(u.getId())
                        .nomUtilisateur(u.getNomUtilisateur())
                        .login(u.getLogin())
                        .email(u.getEmail())
                        .role(u.getRole())
                        .active(u.isActive())
                        .createdAt(u.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/all")
    public ResponseEntity<List<String>> getAllEmails() {
        return ResponseEntity.ok(userService.getAllEmails());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDto> createUser(@RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDto> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id,
                                        @RequestBody UpdateUserRequest request) {
        try {
            UserResponseDto updated = userService.updateUser(id, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDto> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(userService.toggleActive(id));
    }
}