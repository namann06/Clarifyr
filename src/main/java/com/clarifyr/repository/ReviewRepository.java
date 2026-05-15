package com.clarifyr.repository;

import com.clarifyr.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Review entity.
 */
@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    /**
     * Find all reviews for a specific tutor with optimized joins.
     */
    @Query("SELECT r FROM Review r JOIN FETCH r.student WHERE r.tutor.id = :tutorId ORDER BY r.timestamp DESC")
    List<Review> findByTutorId(@Param("tutorId") Long tutorId);

    /**
     * Calculate the average rating for a tutor.
     */
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.tutor.id = :tutorId")
    Double findAverageRatingByTutorId(@Param("tutorId") Long tutorId);
}
