package com.clarifyr.repository;

import com.clarifyr.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for managing chat messages.
 */
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * Fetch conversation history between two users, ordered by timestamp.
     */
    @Query("SELECT m FROM ChatMessage m " +
           "JOIN FETCH m.sender " +
           "JOIN FETCH m.receiver " +
           "WHERE (m.sender.id = :u1 AND m.receiver.id = :u2) " +
           "OR (m.sender.id = :u2 AND m.receiver.id = :u1) " +
           "ORDER BY m.timestamp ASC")
    List<ChatMessage> findConversation(@Param("u1") Long user1, @Param("u2") Long user2);

    /**
     * Fetch all users that the given user has had a conversation with.
     * This is used for the Inbox/Chat list.
     */
    @Query("SELECT DISTINCT CASE WHEN m.sender.id = :userId THEN m.receiver.id ELSE m.sender.id END " +
           "FROM ChatMessage m " +
           "WHERE m.sender.id = :userId OR m.receiver.id = :userId")
    List<Long> findContactIds(@Param("userId") Long userId);
}
