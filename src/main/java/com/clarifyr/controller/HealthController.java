package com.clarifyr.controller;

import com.clarifyr.dto.HealthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

/**
 * Health Check Controller.
 *
 * Provides a public endpoint to verify the API is running.
 * This endpoint does NOT require authentication.
 *
 * Endpoint: GET /api/test
 * Auth:     None (public)
 * Input:    None
 * Output:   HealthResponse { status, message, timestamp }
 * Status:   200 OK
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    /**
     * Health check endpoint.
     * Returns current server status and timestamp.
     *
     * @return 200 OK with HealthResponse body
     */
    @GetMapping("/test")
    public ResponseEntity<HealthResponse> healthCheck() {
        HealthResponse response = HealthResponse.builder()
                .status("UP")
                .message("Clarifyr API is running")
                .timestamp(Instant.now().toString())
                .build();

        return ResponseEntity.ok(response);
    }
}
