package com.clarifyr.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for the health check endpoint.
 *
 * Fields:
 * - status:    System status ("UP" / "DOWN")
 * - message:   Human-readable status message
 * - timestamp: ISO-8601 formatted server time
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthResponse {

    private String status;
    private String message;
    private String timestamp;
}
