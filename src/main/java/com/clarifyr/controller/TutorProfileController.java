package com.clarifyr.controller;

import com.clarifyr.dto.TutorProfileRequest;
import com.clarifyr.dto.TutorProfileResponse;
import com.clarifyr.service.TutorProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for Tutor Profile management.
 */
@RestController
@RequestMapping("/api/tutor/profile")
@RequiredArgsConstructor
public class TutorProfileController {

    private final TutorProfileService tutorProfileService;

    @PostMapping
    public ResponseEntity<TutorProfileResponse> saveProfile(@Valid @RequestBody TutorProfileRequest request) {
        return new ResponseEntity<>(tutorProfileService.saveProfile(request), HttpStatus.CREATED);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<TutorProfileResponse> getProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(tutorProfileService.getProfile(userId));
    }
}
