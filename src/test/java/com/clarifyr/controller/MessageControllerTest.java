package com.clarifyr.controller;

import com.clarifyr.dto.MessageRequest;
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
class MessageControllerTest {

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

    private String getAuthToken(String email) {
        CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername(email);
        return "Bearer " + jwtUtil.generateToken(userDetails);
    }

    private Long studentId;
    private Long tutorId;

    @BeforeEach
    void setUp() {
        studentId = userService.registerUser(UserRegistrationRequest.builder()
                .name("Student User").email("student_chat@test.com").password("password123").role(UserRole.STUDENT).build()).getId();
        
        tutorId = userService.registerUser(UserRegistrationRequest.builder()
                .name("Tutor User").email("tutor_chat@test.com").password("password123").role(UserRole.TUTOR).build()).getId();
    }

    @Test
    @DisplayName("TC-4.1: Send message success")
    void sendMessage_Success() throws Exception {
        MessageRequest request = MessageRequest.builder()
                .senderId(studentId)
                .receiverId(tutorId)
                .content("Hello Tutor!")
                .build();

        mockMvc.perform(post("/api/messages")
                        .header("Authorization", getAuthToken("student_chat@test.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("Hello Tutor!"))
                .andExpect(jsonPath("$.senderName").value("Student User"));
    }

    @Test
    @DisplayName("TC-4.2: Fetch conversation history")
    void getHistory_Success() throws Exception {
        // Send two messages
        MessageRequest m1 = MessageRequest.builder().senderId(studentId).receiverId(tutorId).content("Msg 1").build();
        MessageRequest m2 = MessageRequest.builder().senderId(tutorId).receiverId(studentId).content("Msg 2").build();

        mockMvc.perform(post("/api/messages")
                .header("Authorization", getAuthToken("student_chat@test.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(m1)));
        mockMvc.perform(post("/api/messages")
                .header("Authorization", getAuthToken("tutor_chat@test.com"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(m2)));

        mockMvc.perform(get("/api/messages/history/" + studentId + "/" + tutorId)
                        .header("Authorization", getAuthToken("student_chat@test.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].content").value("Msg 1"))
                .andExpect(jsonPath("$[1].content").value("Msg 2"));
    }

    @Test
    @DisplayName("TC-4.4: Reject empty message")
    void sendMessage_Empty_Fail() throws Exception {
        MessageRequest request = MessageRequest.builder()
                .senderId(studentId)
                .receiverId(tutorId)
                .content("")
                .build();

        mockMvc.perform(post("/api/messages")
                        .header("Authorization", getAuthToken("student_chat@test.com"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
