package com.clarifyr.controller;

import com.clarifyr.dto.UserRegistrationRequest;
import com.clarifyr.entity.UserRole;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("dev")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("TC-1.1: Register a valid user")
    void registerUser_Success() throws Exception {
        UserRegistrationRequest request = UserRegistrationRequest.builder()
                .name("Test Student")
                .email("student@test.com")
                .password("password123")
                .role(UserRole.STUDENT)
                .build();

        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Test Student"))
                .andExpect(jsonPath("$.email").value("student@test.com"))
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    @DisplayName("TC-1.2: Registration fails with duplicate email")
    void registerUser_DuplicateEmail() throws Exception {
        UserRegistrationRequest request = UserRegistrationRequest.builder()
                .name("User 1")
                .email("duplicate@test.com")
                .password("password123")
                .role(UserRole.STUDENT)
                .build();

        // First registration
        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Second registration with same email
        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Conflict"));
    }

    @Test
    @DisplayName("TC-1.3/1.4: Registration fails with invalid data")
    void registerUser_ValidationFailure() throws Exception {
        UserRegistrationRequest request = UserRegistrationRequest.builder()
                .name("") // Blank name
                .email("not-an-email") // Invalid email
                .password("short") // Password < 8
                .role(UserRole.TUTOR)
                .build();

        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.name").exists())
                .andExpect(jsonPath("$.email").exists())
                .andExpect(jsonPath("$.password").exists());
    }

    @Test
    @DisplayName("TC-1.6: Get non-existent user should return 500/404 (Runtime error)")
    @WithMockUser
    void getUser_NotFound() throws Exception {
        mockMvc.perform(get("/api/users/999"))
                .andExpect(status().isInternalServerError()) // Based on current GlobalExceptionHandler
                .andExpect(jsonPath("$.error").value("Internal Server Error"));
    }
}
