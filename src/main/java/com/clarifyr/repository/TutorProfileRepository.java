package com.clarifyr.repository;

import com.clarifyr.entity.TutorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for TutorProfile entity.
 */
@Repository
public interface TutorProfileRepository extends JpaRepository<TutorProfile, Long> {

    /**
     * Optimized query to fetch TutorProfile along with User and Subjects in ONE query.
     * This prevents LazyInitializationException and the N+1 select problem.
     */
    @Query("SELECT tp FROM TutorProfile tp " +
           "LEFT JOIN FETCH tp.user " +
           "LEFT JOIN FETCH tp.subjects " +
           "WHERE tp.id = :id")
    Optional<TutorProfile> findByIdWithUserAndSubjects(@Param("id") Long id);
}
