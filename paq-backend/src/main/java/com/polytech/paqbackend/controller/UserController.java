package com.polytech.paqbackend.controller;


import com.polytech.paqbackend.entity.User;
import com.polytech.paqbackend.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5177")
public class UserController {
    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Lister tous les utilisateurs
    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Ajouter un utilisateur
    @PostMapping
    public User createUser(@RequestBody User user) {
        return userRepository.save(user);
    }

    // Chercher un utilisateur par ID
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userRepository.findById(id).orElse(null);
    }

    // Mettre à jour un utilisateur
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            user.setLogin(userDetails.getLogin());
            user.setNomUtilisateur(userDetails.getNomUtilisateur());

            if (userDetails.getPassword() != null && !userDetails.getPassword().isBlank()) {
                user.setPassword(userDetails.getPassword());
            }

            user.setRole(userDetails.getRole());
            return userRepository.save(user);
        }
        return null;
    }


    // Supprimer un utilisateur
    @DeleteMapping("/{id}")
    public String deleteUser(@PathVariable Long id) {
        if(userRepository.existsById(id)){
            userRepository.deleteById(id);
            return "Deleted";
        } else {
            return "User not found";
        }
    }
}
