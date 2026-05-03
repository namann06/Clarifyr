package com.clarifyr.service;

import com.clarifyr.dto.MessageRequest;
import com.clarifyr.dto.MessageResponse;
import com.clarifyr.entity.ChatMessage;
import com.clarifyr.entity.User;
import com.clarifyr.repository.ChatMessageRepository;
import com.clarifyr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing chat messages.
 */
@Service
@RequiredArgsConstructor
public class MessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    /**
     * Send a message.
     */
    @Transactional
    public MessageResponse sendMessage(MessageRequest request) {
        User sender = userRepository.findById(request.getSenderId())
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .receiver(receiver)
                .content(request.getContent())
                .timestamp(LocalDateTime.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(message);
        return mapToResponse(saved);
    }

    /**
     * Get conversation history between two users.
     */
    @Transactional(readOnly = true)
    public List<MessageResponse> getConversation(Long u1, Long u2) {
        return chatMessageRepository.findConversation(u1, u2).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private MessageResponse mapToResponse(ChatMessage message) {
        return MessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getName())
                .receiverId(message.getReceiver().getId())
                .receiverName(message.getReceiver().getName())
                .receiverEmail(message.getReceiver().getEmail())
                .content(message.getContent())
                .timestamp(message.getTimestamp())
                .build();
    }
}
