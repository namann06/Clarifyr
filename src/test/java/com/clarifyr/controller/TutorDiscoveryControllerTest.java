package com.clarifyr.controller;

import com.clarifyr.dto.TutorProfileRequest;
import com.clarifyr.dto.UserRegistrationRequest;
import com.clarifyr.entity.UserRole;
import com.clarifyr.service.TutorProfileService;
import com.clarifyr.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("dev")
class TutorDiscoveryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private TutorProfileService tutorProfileService;

    @BeforeEach
    void setUp() {
        // Register Tutor 1: Java Expert
        Long id1 = userService.registerUser(UserRegistrationRequest.builder()
                .name("Java Guru").email("java@test.com").password("password123").role(UserRole.TUTOR).build()).getId();
        tutorProfileService.saveProfile(TutorProfileRequest.builder()
                .userId(id1).subjects(List.of("Java")).description("Senior Java Expert").pricing(50.0).build());

        // Register Tutor 2: Math Teacher
        Long id2 = userService.registerUser(UserRegistrationRequest.builder()
                .name("Math Pro").email("math@test.com").password("password123").role(UserRole.TUTOR).build()).getId();
        tutorProfileService.saveProfile(TutorProfileRequest.builder()
                .userId(id2).subjects(List.of("Math")).description("Patient Math Teacher").pricing(30.0).build());
    }

    @Test
    @DisplayName("TC-3.1: Get all tutors")
    void getAllTutors_Success() throws Exception {
        mockMvc.perform(get("/api/tutors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$[*].tutorName").value(hasItems("Java Guru", "Math Pro")));
    }

    @Test
    @DisplayName("TC-3.2: Search by subject")
    void searchBySubject_Success() throws Exception {
        mockMvc.perform(get("/api/tutors/search").param("subject", "Java"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$[*].tutorName").value(hasItem("Java Guru")));
    }

    @Test
    @DisplayName("TC-3.3: Search by keyword in description")
    void searchByKeyword_Success() throws Exception {
        mockMvc.perform(get("/api/tutors/search").param("query", "Patient"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].tutorName").value("Math Pro"));
    }

    @Test
    @DisplayName("TC-3.4: Search with no results")
    void searchNoResults_Success() throws Exception {
        mockMvc.perform(get("/api/tutors/search").param("subject", "Physics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
