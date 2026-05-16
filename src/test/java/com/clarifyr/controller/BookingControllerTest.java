package com.clarifyr.controller;

import com.clarifyr.dto.BookingRequest;
import com.clarifyr.dto.TutorProfileRequest;
import com.clarifyr.dto.UserRegistrationRequest;
import com.clarifyr.entity.BookingStatus;
import com.clarifyr.entity.UserRole;
import com.clarifyr.security.CustomUserDetails;
import com.clarifyr.security.CustomUserDetailsService;
import com.clarifyr.security.JwtUtil;
import com.clarifyr.service.TutorProfileService;
import com.clarifyr.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("dev")
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserService userService;

    @Autowired
    private TutorProfileService tutorProfileService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    private Long studentId;
    private Long tutorId;
    private String studentToken;
    private String tutorToken;

    @BeforeEach
    void setUp() {
        // Register Student
        studentId = userService.registerUser(UserRegistrationRequest.builder()
                .name("Student User").email("student_booking@test.com").password("password123").role(UserRole.STUDENT).build()).getId();
        
        // Register Tutor
        tutorId = userService.registerUser(UserRegistrationRequest.builder()
                .name("Tutor User").email("tutor_booking@test.com").password("password123").role(UserRole.TUTOR).build()).getId();

        // Create Tutor Profile (Required for pricing)
        tutorProfileService.saveProfile(TutorProfileRequest.builder()
                .userId(tutorId)
                .subjects(List.of("Math"))
                .description("Math Tutor")
                .pricing(100.0)
                .build());

        studentToken = "Bearer " + jwtUtil.generateToken((CustomUserDetails) userDetailsService.loadUserByUsername("student_booking@test.com"));
        tutorToken = "Bearer " + jwtUtil.generateToken((CustomUserDetails) userDetailsService.loadUserByUsername("tutor_booking@test.com"));
    }

    @Test
    @DisplayName("TC-8.1: Request booking success")
    void createBooking_Success() throws Exception {
        BookingRequest request = BookingRequest.builder()
                .tutorId(tutorId)
                .startTime(LocalDateTime.now().plusDays(1))
                .durationInMinutes(60)
                .build();

        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.totalPrice").value(100.0));
    }

    @Test
    @DisplayName("TC-8.2: Overlapping booking fails")
    void createBooking_Overlap_Fail() throws Exception {
        LocalDateTime start = LocalDateTime.now().plusDays(2);
        
        BookingRequest request1 = BookingRequest.builder()
                .tutorId(tutorId).startTime(start).durationInMinutes(60).build();

        // First booking
        mockMvc.perform(post("/api/bookings")
                .header("Authorization", studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isCreated());

        // Overlapping booking (starting 30 mins into the first one)
        BookingRequest request2 = BookingRequest.builder()
                .tutorId(tutorId).startTime(start.plusMinutes(30)).durationInMinutes(60).build();

        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isInternalServerError()) // or specific exception handling if implemented
                .andExpect(jsonPath("$.message").value("The tutor already has a booking during this time."));
    }

    @Test
    @DisplayName("TC-8.3: Tutor confirms booking")
    void confirmBooking_Success() throws Exception {
        BookingRequest request = BookingRequest.builder()
                .tutorId(tutorId)
                .startTime(LocalDateTime.now().plusDays(3))
                .durationInMinutes(60)
                .build();

        String response = mockMvc.perform(post("/api/bookings")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn().getResponse().getContentAsString();
        
        Long bookingId = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(patch("/api/bookings/" + bookingId + "/status")
                        .header("Authorization", tutorToken)
                        .param("status", "CONFIRMED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }
}
