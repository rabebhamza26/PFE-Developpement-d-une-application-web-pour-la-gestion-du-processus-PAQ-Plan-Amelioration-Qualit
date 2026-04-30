package com.polytech.paqbackend.config;

import com.polytech.paqbackend.entity.User;
import com.polytech.paqbackend.repository.UserRepository;
import com.polytech.paqbackend.token.TokenRepository;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j                          // ✅ CORRECTION : ajoute log automatiquement
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final TokenRepository tokenRepository; // ✅ pour vérifier si le token est révoqué

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // 🔥 1. Autoriser WebSocket (IMPORTANT)


        if (request.getServletPath().contains("/api/auth/")
                || request.getServletPath().startsWith("/ws")
                || request.getMethod().equals("OPTIONS")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 🔥 2. Autoriser login
        if (request.getServletPath().contains("/api/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);

        try {
            final String login = jwtService.extractUsername(jwt);

            if (login != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                User user = userRepository.findByLogin(login);

                boolean isTokenValid = tokenRepository.findByToken(jwt)
                        .map(t -> !t.isExpired() && !t.isRevoked())
                        .orElse(false);

                if (user != null && user.isActive()
                        && jwtService.isTokenValid(jwt, login)
                        && isTokenValid) {

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    user,
                                    null,
                                    user.getAuthorities()
                            );

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    log.debug("User {} authenticated", login);
                }
            }

        } catch (ExpiredJwtException e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"TOKEN_EXPIRED\"}");
            return;

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"INVALID_TOKEN\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}