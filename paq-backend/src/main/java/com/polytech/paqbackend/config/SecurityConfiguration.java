package com.polytech.paqbackend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.web.cors.CorsConfiguration;

import java.util.Arrays;

import static org.springframework.security.config.http.SessionCreationPolicy.STATELESS;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@EnableMethodSecurity
public class SecurityConfiguration {

    private static final String[] WHITE_LIST_URL = {
            "/api/auth/**",
            "/api/users/all",
            "/v2/api-docs",
            "/v3/api-docs",
            "/v3/api-docs/**",
            "/swagger-ui.html",
            "/swagger-ui/**",
            "/swagger-resources/**",
            "/webjars/**",
            "/error"
    };

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;
    private final LogoutHandler logoutHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(request -> {
                    var corsConfig = new CorsConfiguration();

                    corsConfig.setAllowedOriginPatterns(Arrays.asList(
                            "http://localhost:*",
                            "http://127.0.0.1:*"
                    ));

                    corsConfig.setAllowedMethods(Arrays.asList(
                            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
                    ));

                    corsConfig.setAllowedHeaders(Arrays.asList("*"));
                    corsConfig.setAllowCredentials(true);

                    return corsConfig;
                }))


                .authorizeHttpRequests(req -> req
                        .requestMatchers(WHITE_LIST_URL).permitAll()

                        // 🔥 CRUCIAL POUR WEBSOCKET
                        .requestMatchers("/ws/**", "/ws").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/sites/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/plants/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/users/all").authenticated()  // Accessible aux utilisateurs connectés
                        .requestMatchers(HttpMethod.GET, "/api/users/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .addLogoutHandler(logoutHandler)
                        .logoutSuccessHandler((request, response, authentication) ->
                                SecurityContextHolder.clearContext())
                );

        return http.build();
    }
}
