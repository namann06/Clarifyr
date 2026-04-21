package com.clarifyr.repository;

import com.clarifyr.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for User entity.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * Find a user by their email address.
     * @param email The email to search for.
     * @return An Optional containing the user if found.
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if a user exists with the given email.
     * @param email The email to check.
     * @return true if a user exists with the given email.
     */
    boolean existsByEmail(String email);
}
