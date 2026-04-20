package com.clarifyr.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for HealthController.
 *
 * Test Cases:
 * - TC-02: Health endpoint returns 200
 * - TC-03: Response contains all required fields
 * - TC-05: Unknown endpoint returns 401 (secured by Spring Security)
 * - TC-06: Protected endpoint requires auth (returns 401)
 */
@SpringBootTest
@AutoConfigureMockMvc
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    /**
     * TC-02: GET /api/test should return HTTP 200 OK
     */
    @Test
    @DisplayName("TC-02: GET /api/test should return 200 OK")
    void healthCheck_shouldReturn200() throws Exception {
        mockMvc.perform(get("/api/test"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    /**
     * TC-03: Response body should contain status, message, and timestamp fields
     * All fields must be non-null
     */
    @Test
    @DisplayName("TC-03: Response should contain status, message, and timestamp")
    void healthCheck_shouldContainRequiredFields() throws Exception {
        mockMvc.perform(get("/api/test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.message").value("Clarifyr API is running"))
                .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    /**
     * TC-05: Requesting an unknown endpoint should NOT return 500.
     * With Spring Security active, unauthenticated requests to unknown
     * endpoints return 401 (not 404) because auth check happens first.
     */
    @Test
    @DisplayName("TC-05: Unknown endpoint should not return 500")
    void unknownEndpoint_shouldNotReturn500() throws Exception {
        mockMvc.perform(get("/api/nonexistent"))
                .andExpect(status().is4xxClientError());
        // Expect 401 (Unauthorized) since Spring Security intercepts before 404
    }

    /**
     * TC-06: Any non-public endpoint should require authentication.
     * An unauthenticated request should receive 401 Unauthorized.
     */
    @Test
    @DisplayName("TC-06: Protected endpoint should return 401 without auth")
    void protectedEndpoint_shouldReturn401WithoutAuth() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());
    }
}
