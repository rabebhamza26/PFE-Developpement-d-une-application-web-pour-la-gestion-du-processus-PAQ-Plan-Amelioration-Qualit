package com.polytech.paqbackend.config;

import com.polytech.paqbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.client.RestTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

@Configuration
@RequiredArgsConstructor
public class ApplicationConfig {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // injecté depuis PasswordConfig (BCrypt)

    @Bean
    public UserDetailsService userDetailsService() {
        return login -> {
            com.polytech.paqbackend.entity.User user = userRepository.findByLogin(login);
            if (user == null) {
                throw new UsernameNotFoundException("Utilisateur non trouvé : " + login);
            }
            return user;
        };
    }

    @Bean

    public AuthenticationProvider authenticationProvider() {
        return new AuthenticationProvider() {
            @Override
            public Authentication authenticate(Authentication auth) throws AuthenticationException {
                String login = auth.getName();
                String rawPassword = auth.getCredentials().toString();

                com.polytech.paqbackend.entity.User user = userRepository.findByLogin(login);

                if (user == null) {
                    throw new BadCredentialsException("Utilisateur non trouvé");
                }
                if (!user.isActive()) {
                    throw new DisabledException("Compte désactivé");
                }
                if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
                    throw new BadCredentialsException("Mot de passe incorrect");
                }

                return new UsernamePasswordAuthenticationToken(
                        user, null, user.getAuthorities()
                );
            }

            @Override
            public boolean supports(Class<?> authentication) {
                return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
            }
        };
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}