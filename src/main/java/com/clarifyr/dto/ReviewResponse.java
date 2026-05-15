package com.clarifyr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO representing a review response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private Long tutorId;
    private Integer rating;
    private String comment;
    private LocalDateTime timestamp;
}
