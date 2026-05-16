package com.clarifyr.repository;

import com.clarifyr.entity.Booking;
import com.clarifyr.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for Booking entity.
 */
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByStudentIdOrderByStartTimeDesc(Long studentId);

    List<Booking> findByTutorIdOrderByStartTimeDesc(Long tutorId);

    /**
     * Check for any overlapping bookings for a tutor that are not CANCELLED.
     */
    @Query("SELECT COUNT(b) > 0 FROM Booking b " +
           "WHERE b.tutor.id = :tutorId " +
           "AND b.status IN (com.clarifyr.entity.BookingStatus.PENDING, com.clarifyr.entity.BookingStatus.CONFIRMED) " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    boolean existsOverlappingBooking(
            @Param("tutorId") Long tutorId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}
