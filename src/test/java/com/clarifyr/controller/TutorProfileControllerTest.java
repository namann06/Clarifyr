package com.clarifyr.controller;

import com.clarifyr.dto.TutorProfileRequest;
import com.clarifyr.dto.UserRegistrationRequest;
import com.clarifyr.entity.UserRole;
import com.clarifyr.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("dev")
class TutorProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserService userService;

    @Test
    @DisplayName("TC-2.1: Create Profile for valid TUTOR")
    void createProfile_Success() throws Exception {
        // 1. Register a Tutor
        UserRegistrationRequest userRequest = UserRegistrationRequest.builder()
                .name("Tutor User")
                .email("tutor@test.com")
                .password("password123")
                .role(UserRole.TUTOR)
                .build();
        Long userId = userService.registerUser(userRequest).getId();

        // 2. Create Profile
        TutorProfileRequest profileRequest = TutorProfileRequest.builder()
                .userId(userId)
                .subjects(List.of("Java", "Spring Boot"))
                .description("Expert backend developer")
                .pricing(50.0)
                .availability("Weekends")
                .build();

        mockMvc.perform(post("/api/tutor/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tutorName").value("Tutor User"))
                .andExpect(jsonPath("$.subjects[0]").value("Java"))
                .andExpect(jsonPath("$.pricing").value(50.0));
    }

    @Test
    @DisplayName("TC-2.2: Create Profile fails for STUDENT role")
    void createProfile_FailsForStudent() throws Exception {
        // 1. Register a Student
        UserRegistrationRequest userRequest = UserRegistrationRequest.builder()
                .name("Student User")
                .email("student_tutor@test.com")
                .password("password123")
                .role(UserRole.STUDENT)
                .build();
        Long userId = userService.registerUser(userRequest).getId();

        // 2. Attempt to Create Profile
        TutorProfileRequest profileRequest = TutorProfileRequest.builder()
                .userId(userId)
                .subjects(List.of("Math"))
                .description("Trying to be a tutor")
                .pricing(10.0)
                .build();

        mockMvc.perform(post("/api/tutor/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("Only users with TUTOR role can create a profile."));
    }

    @Test
    @DisplayName("TC-2.3: Get existing Profile")
    void getProfile_Success() throws Exception {
        // 1. Setup Tutor and Profile
        UserRegistrationRequest userRequest = UserRegistrationRequest.builder()
                .name("Get Tutor")
                .email("get_tutor@test.com")
                .password("password123")
                .role(UserRole.TUTOR)
                .build();
        Long userId = userService.registerUser(userRequest).getId();

        TutorProfileRequest profileRequest = TutorProfileRequest.builder()
                .userId(userId)
                .subjects(List.of("React"))
                .description("Frontend expert")
                .pricing(40.0)
                .build();
        
        mockMvc.perform(post("/api/tutor/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileRequest)))
                .andExpect(status().isCreated());

        // 2. Fetch Profile
        mockMvc.perform(get("/api/tutor/profile/" + userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("Frontend expert"));
    }
}
