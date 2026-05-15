package com.clarifyr.controller;

import com.clarifyr.dto.ReviewRequest;
import com.clarifyr.dto.ReviewResponse;
import com.clarifyr.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for Review operations.
 */
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * Submit a review for a tutor.
     * Requires authentication.
     */
    @PostMapping
    public ResponseEntity<ReviewResponse> addReview(
            Authentication authentication,
            @Valid @RequestBody ReviewRequest request) {
        String studentEmail = authentication.getName();
        return new ResponseEntity<>(reviewService.addReview(studentEmail, request), HttpStatus.CREATED);
    }

    /**
     * Get all reviews for a specific tutor.
     * Public access.
     */
    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsForTutor(@PathVariable Long tutorId) {
        return ResponseEntity.ok(reviewService.getReviewsForTutor(tutorId));
    }

    /**
     * Get the average rating of a tutor.
     * Public access.
     */
    @GetMapping("/tutor/{tutorId}/average")
    public ResponseEntity<Double> getAverageRating(@PathVariable Long tutorId) {
        return ResponseEntity.ok(reviewService.getAverageRating(tutorId));
    }
}
