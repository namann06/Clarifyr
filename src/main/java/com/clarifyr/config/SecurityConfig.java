package com.clarifyr.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Security Configuration for Clarifyr API.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Endpoints that do NOT require authentication
    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/test",
            "/api/test/**",
            "/api/users/register",
            "/api/tutor/profile/**"
    };

    /**
     * Password encoder bean for BCrypt hashing.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Main security filter chain.
     * Configures HTTP security for the entire application.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF — we're building a stateless REST API
                .csrf(csrf -> csrf.disable())

                // Configure CORS with restricted origins
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Stateless session management (no server-side sessions)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Authorization rules
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints — no auth required
                        .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                        // Everything else — requires authentication
                        .anyRequest().authenticated()
                )

                // Return 401 (not 403) for unauthenticated requests to protected endpoints
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpStatus.UNAUTHORIZED.value());
                            response.setContentType("application/json");
                            response.getWriter().write(
                                    "{\"error\": \"Unauthorized\", \"message\": \"Authentication required\"}"
                            );
                        })
                );

        return http.build();
    }

    /**
     * CORS configuration.
     
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Allowed origins — add your frontend URL here
        config.setAllowedOrigins(List.of(
                "http://localhost:3000",   // Flutter web dev server
                "http://localhost:8080"    // Same-origin requests
        ));

        // Allowed HTTP methods
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // Allowed headers
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));

        // Allow credentials (cookies, auth headers)
        config.setAllowCredentials(true);

        // How long the browser should cache preflight responses (1 hour)
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);

        return source;
    }
}
