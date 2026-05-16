package com.clarifyr.service;

import com.clarifyr.dto.BookingRequest;
import com.clarifyr.dto.BookingResponse;
import com.clarifyr.entity.*;
import com.clarifyr.exception.ForbiddenActionException;
import com.clarifyr.repository.BookingRepository;
import com.clarifyr.repository.TutorProfileRepository;
import com.clarifyr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing bookings and schedules.
 */
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final TutorProfileRepository tutorProfileRepository;

    /**
     * Create a new booking request.
     */
    @Transactional
    public BookingResponse createBooking(String studentEmail, BookingRequest request) {
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (student.getRole() != UserRole.STUDENT) {
            throw new ForbiddenActionException("Only students can request bookings.");
        }

        User tutor = userRepository.findById(request.getTutorId())
                .orElseThrow(() -> new RuntimeException("Tutor not found"));

        if (tutor.getRole() != UserRole.TUTOR) {
            throw new ForbiddenActionException("Selected user is not a tutor.");
        }

        TutorProfile profile = tutorProfileRepository.findByUserId(tutor.getId())
                .orElseThrow(() -> new RuntimeException("Tutor has no active profile."));

        LocalDateTime endTime = request.getStartTime().plusMinutes(request.getDurationInMinutes());

        // Check for overlaps
        if (bookingRepository.existsOverlappingBooking(tutor.getId(), request.getStartTime(), endTime)) {
            throw new IllegalStateException("The tutor already has a booking during this time.");
        }

        // Calculate price (assuming price is per hour)
        double hourlyRate = profile.getPricing();
        double totalPrice = (hourlyRate / 60.0) * request.getDurationInMinutes();

        Booking booking = Booking.builder()
                .student(student)
                .tutor(tutor)
                .startTime(request.getStartTime())
                .endTime(endTime)
                .status(BookingStatus.PENDING)
                .totalPrice(totalPrice)
                .createdAt(LocalDateTime.now())
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        return mapToResponse(savedBooking);
    }

    /**
     * Update booking status (Confirm/Cancel).
     */
    @Transactional
    public BookingResponse updateBookingStatus(String userEmail, Long bookingId, BookingStatus newStatus) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Only tutor can confirm
        if (newStatus == BookingStatus.CONFIRMED && !booking.getTutor().getId().equals(user.getId())) {
            throw new ForbiddenActionException("Only the tutor can confirm a booking.");
        }

        // Either can cancel
        if (newStatus == BookingStatus.CANCELLED) {
            if (!booking.getStudent().getId().equals(user.getId()) && !booking.getTutor().getId().equals(user.getId())) {
                throw new ForbiddenActionException("You are not authorized to cancel this booking.");
            }
        }

        booking.setStatus(newStatus);
        return mapToResponse(bookingRepository.save(booking));
    }

    /**
     * Get user's schedule.
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getMySchedule(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Booking> bookings;
        if (user.getRole() == UserRole.TUTOR) {
            bookings = bookingRepository.findByTutorIdOrderByStartTimeDesc(user.getId());
        } else {
            bookings = bookingRepository.findByStudentIdOrderByStartTimeDesc(user.getId());
        }

        return bookings.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private BookingResponse mapToResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .studentId(booking.getStudent().getId())
                .studentName(booking.getStudent().getName())
                .tutorId(booking.getTutor().getId())
                .tutorName(booking.getTutor().getName())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .status(booking.getStatus())
                .totalPrice(booking.getTotalPrice())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
