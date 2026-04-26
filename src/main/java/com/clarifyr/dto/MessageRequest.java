package com.clarifyr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for sending a message.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {

    @NotNull(message = "Sender ID is required")
    private Long senderId;

    @NotNull(message = "Receiver ID is required")
    private Long receiverId;

    @NotBlank(message = "Message content cannot be empty")
    @Size(max = 2000, message = "Message is too long")
    private String content;
}
