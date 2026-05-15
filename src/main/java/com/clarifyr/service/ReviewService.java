package com.clarifyr.service;

import com.clarifyr.dto.ReviewRequest;
import com.clarifyr.dto.ReviewResponse;
import com.clarifyr.entity.Review;
import com.clarifyr.entity.User;
import com.clarifyr.entity.UserRole;
import com.clarifyr.exception.ForbiddenActionException;
import com.clarifyr.repository.ReviewRepository;
import com.clarifyr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing reviews.
 */
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    /**
     * Submit a review.
     * @param studentEmail The email of the student submitting the review (from JWT).
     * @param request The review request.
     * @return The created review as a response DTO.
     */
    @Transactional
    public ReviewResponse addReview(String studentEmail, ReviewRequest request) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (student.getRole() != UserRole.STUDENT) {
            throw new ForbiddenActionException("Only users with STUDENT role can leave reviews.");
        }

        User tutor = userRepository.findById(request.getTutorId())
                .orElseThrow(() -> new RuntimeException("Tutor not found"));

        if (tutor.getRole() != UserRole.TUTOR) {
            throw new ForbiddenActionException("Reviews can only be left for users with TUTOR role.");
        }

        if (student.getId().equals(tutor.getId())) {
            throw new ForbiddenActionException("You cannot review yourself.");
        }

        Review review = Review.builder()
                .student(student)
                .tutor(tutor)
                .rating(request.getRating())
                .comment(request.getComment())
                .timestamp(LocalDateTime.now())
                .build();

        Review savedReview = reviewRepository.save(review);
        return mapToResponse(savedReview);
    }

    /**
     * Get all reviews for a tutor.
     */
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsForTutor(Long tutorId) {
        return reviewRepository.findByTutorId(tutorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get the average rating for a tutor.
     */
    @Transactional(readOnly = true)
    public Double getAverageRating(Long tutorId) {
        Double avg = reviewRepository.findAverageRatingByTutorId(tutorId);
        return avg != null ? avg : 0.0;
    }

    private ReviewResponse mapToResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .studentId(review.getStudent().getId())
                .studentName(review.getStudent().getName())
                .tutorId(review.getTutor().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .timestamp(review.getTimestamp())
                .build();
    }
}
