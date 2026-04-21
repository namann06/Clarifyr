package com.clarifyr.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for creating/updating a Tutor Profile.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TutorProfileRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotEmpty(message = "At least one subject is required")
    private List<String> subjects;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Pricing is required")
    @Min(value = 0, message = "Pricing cannot be negative")
    private Double pricing;

    private String availability;
}
