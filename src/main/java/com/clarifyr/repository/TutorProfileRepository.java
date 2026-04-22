package com.clarifyr.repository;

import com.clarifyr.entity.TutorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

/**
 * Repository for TutorProfile entity.
 */
import java.util.List;
import java.util.Optional;

/**
 * Repository for TutorProfile entity.
 */
@Repository
public interface TutorProfileRepository extends JpaRepository<TutorProfile, Long> {

    /**
     * Optimized query to fetch TutorProfile along with User and Subjects in ONE query.
     */
    @Query("SELECT DISTINCT tp FROM TutorProfile tp " +
           "LEFT JOIN FETCH tp.user " +
           "LEFT JOIN FETCH tp.subjects " +
           "WHERE tp.id = :id")
    Optional<TutorProfile> findByIdWithUserAndSubjects(@Param("id") Long id);

    /**
     * Fetch all tutor profiles with optimized joins.
     */
    @Query("SELECT DISTINCT tp FROM TutorProfile tp " +
           "LEFT JOIN FETCH tp.user " +
           "LEFT JOIN FETCH tp.subjects")
    Set<TutorProfile> findAllWithUserAndSubjects();

    /**
     * Search tutors by a specific subject.
     */
    @Query("SELECT DISTINCT tp FROM TutorProfile tp " +
           "LEFT JOIN FETCH tp.user " +
           "LEFT JOIN FETCH tp.subjects " +
           "JOIN tp.subjects s " +
           "WHERE LOWER(s) = LOWER(:subject)")
    Set<TutorProfile> findBySubject(@Param("subject") String subject);

    /**
     * Search tutors by keywords in their description.
     */
    @Query("SELECT DISTINCT tp FROM TutorProfile tp " +
           "LEFT JOIN FETCH tp.user " +
           "LEFT JOIN FETCH tp.subjects " +
           "WHERE LOWER(tp.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    Set<TutorProfile> searchByDescription(@Param("query") String query);
}
