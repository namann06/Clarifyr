package com.clarifyr.controller;

import com.clarifyr.dto.MessageRequest;
import com.clarifyr.dto.MessageResponse;
import com.clarifyr.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for Messaging operations.
 */
@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    /**
     * Send a message.
     */
    @PostMapping
    public ResponseEntity<MessageResponse> sendMessage(@Valid @RequestBody MessageRequest request) {
        return new ResponseEntity<>(messageService.sendMessage(request), HttpStatus.CREATED);
    }

    /**
     * Get conversation history between two users.
     */
    @GetMapping("/history/{u1}/{u2}")
    public ResponseEntity<List<MessageResponse>> getConversation(
            @PathVariable Long u1,
            @PathVariable Long u2) {
        return ResponseEntity.ok(messageService.getConversation(u1, u2));
    }
}
