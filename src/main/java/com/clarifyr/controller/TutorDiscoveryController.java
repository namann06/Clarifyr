package com.clarifyr.controller;

import com.clarifyr.dto.TutorProfileResponse;
import com.clarifyr.service.TutorDiscoveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for Tutor Discovery operations.
 */
@RestController
@RequestMapping("/api/tutors")
@RequiredArgsConstructor
public class TutorDiscoveryController {

    private final TutorDiscoveryService tutorDiscoveryService;

    /**
     * List all tutors.
     */
    @GetMapping
    public ResponseEntity<List<TutorProfileResponse>> getAllTutors() {
        return ResponseEntity.ok(tutorDiscoveryService.getAllTutors());
    }

    /**
     * Search/Filter tutors.
     * Params: subject (optional), query (optional)
     */
    @GetMapping("/search")
    public ResponseEntity<List<TutorProfileResponse>> searchTutors(
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(tutorDiscoveryService.searchTutors(subject, query));
    }
}
