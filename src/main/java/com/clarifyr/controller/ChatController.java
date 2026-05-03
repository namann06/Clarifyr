package com.clarifyr.controller;

import com.clarifyr.dto.MessageRequest;
import com.clarifyr.dto.MessageResponse;
import com.clarifyr.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;

    /**
     * Handles incoming real-time chat messages via STOMP.
     * Expects messages sent to /app/chat.send
     */
    @MessageMapping("/chat.send")
    public void processMessage(@Payload MessageRequest chatMessage) {
        log.info("Received real-time message from {} to {}", chatMessage.getSenderId(), chatMessage.getReceiverId());

        // Save message to database
        MessageResponse savedMessage = messageService.sendMessage(chatMessage);

        // Send to the receiver's private queue: /user/{username}/queue/messages
        // In our app, username is the user's email.
        String receiverEmail = savedMessage.getReceiverEmail();
        messagingTemplate.convertAndSendToUser(
                receiverEmail,
                "/queue/messages",
                savedMessage
        );
        
        log.info("Message broadcasted to user: {}", receiverEmail);
    }
}
