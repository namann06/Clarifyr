package com.clarifyr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for responding with Tutor Profile data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TutorProfileResponse {
    private Long userId;
    private String tutorName;
    private List<String> subjects;
    private String description;
    private Double pricing;
    private String availability;
}
