package com.clarifyr.controller;

import com.clarifyr.dto.ReviewRequest;
import com.clarifyr.dto.UserRegistrationRequest;
import com.clarifyr.entity.UserRole;
import com.clarifyr.security.CustomUserDetails;
import com.clarifyr.security.CustomUserDetailsService;
import com.clarifyr.security.JwtUtil;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("dev")
class ReviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserService userService;

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
                .name("Student User").email("student_review@test.com").password("password123").role(UserRole.STUDENT).build()).getId();
        
        // Register Tutor
        tutorId = userService.registerUser(UserRegistrationRequest.builder()
                .name("Tutor User").email("tutor_review@test.com").password("password123").role(UserRole.TUTOR).build()).getId();

        studentToken = "Bearer " + jwtUtil.generateToken((CustomUserDetails) userDetailsService.loadUserByUsername("student_review@test.com"));
        tutorToken = "Bearer " + jwtUtil.generateToken((CustomUserDetails) userDetailsService.loadUserByUsername("tutor_review@test.com"));
    }

    @Test
    @DisplayName("TC-7.1: Add review success")
    void addReview_Success() throws Exception {
        ReviewRequest request = ReviewRequest.builder()
                .tutorId(tutorId)
                .rating(5)
                .comment("Excellent tutor!")
                .build();

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.comment").value("Excellent tutor!"))
                .andExpect(jsonPath("$.studentName").value("Student User"));
    }

    @Test
    @DisplayName("TC-7.2: Only student can leave review")
    void addReview_FailsForTutor() throws Exception {
        ReviewRequest request = ReviewRequest.builder()
                .tutorId(tutorId)
                .rating(4)
                .comment("Nice colleague")
                .build();

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", tutorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Only users with STUDENT role can leave reviews."));
    }

    @Test
    @DisplayName("TC-7.3: Invalid rating range")
    void addReview_InvalidRating_Fail() throws Exception {
        ReviewRequest request = ReviewRequest.builder()
                .tutorId(tutorId)
                .rating(6)
                .comment("Bad rating")
                .build();

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC-7.4: Fetch reviews and average rating")
    void getReviews_Success() throws Exception {
        // Add two reviews
        ReviewRequest r1 = ReviewRequest.builder().tutorId(tutorId).rating(5).comment("Best").build();
        ReviewRequest r2 = ReviewRequest.builder().tutorId(tutorId).rating(3).comment("Average").build();

        mockMvc.perform(post("/api/reviews").header("Authorization", studentToken).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(r1)));
        
        // Register another student for second review to be realistic
        userService.registerUser(UserRegistrationRequest.builder()
                .name("Student 2").email("student2_review@test.com").password("password123").role(UserRole.STUDENT).build());
        String token2 = "Bearer " + jwtUtil.generateToken((CustomUserDetails) userDetailsService.loadUserByUsername("student2_review@test.com"));
        
        mockMvc.perform(post("/api/reviews").header("Authorization", token2).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(r2)));

        mockMvc.perform(get("/api/reviews/tutor/" + tutorId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        mockMvc.perform(get("/api/reviews/tutor/" + tutorId + "/average"))
                .andExpect(status().isOk())
                .andExpect(content().string("4.0"));
    }
}
