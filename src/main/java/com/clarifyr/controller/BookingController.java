package com.clarifyr.controller;

import com.clarifyr.dto.BookingRequest;
import com.clarifyr.dto.BookingResponse;
import com.clarifyr.entity.BookingStatus;
import com.clarifyr.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for Booking and Scheduling operations.
 */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /**
     * Request a new booking.
     */
    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            Authentication authentication,
            @Valid @RequestBody BookingRequest request) {
        return new ResponseEntity<>(bookingService.createBooking(authentication.getName(), request), HttpStatus.CREATED);
    }

    /**
     * Update booking status (e.g., Tutor confirms).
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<BookingResponse> updateStatus(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam BookingStatus status) {
        return ResponseEntity.ok(bookingService.updateBookingStatus(authentication.getName(), id, status));
    }

    /**
     * Get current user's schedule (student or tutor).
     */
    @GetMapping("/my-schedule")
    public ResponseEntity<List<BookingResponse>> getMySchedule(Authentication authentication) {
        return ResponseEntity.ok(bookingService.getMySchedule(authentication.getName()));
    }
}
