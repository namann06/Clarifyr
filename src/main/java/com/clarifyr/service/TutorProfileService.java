package com.clarifyr.service;

import com.clarifyr.dto.TutorProfileRequest;
import com.clarifyr.dto.TutorProfileResponse;
import com.clarifyr.entity.TutorProfile;
import com.clarifyr.entity.User;
import com.clarifyr.entity.UserRole;
import com.clarifyr.exception.ForbiddenActionException;
import com.clarifyr.repository.TutorProfileRepository;
import com.clarifyr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing Tutor Profiles.
 */
@Service
@RequiredArgsConstructor
public class TutorProfileService {

    private final TutorProfileRepository tutorProfileRepository;
    private final UserRepository userRepository;

    /**
     * Create or update a tutor profile.
     */
    @Transactional
    public TutorProfileResponse saveProfile(TutorProfileRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != UserRole.TUTOR) {
            throw new ForbiddenActionException("Only users with TUTOR role can create a profile.");
        }

        TutorProfile profile = TutorProfile.builder()
                .user(user)
                .subjects(request.getSubjects())
                .description(request.getDescription())
                .pricing(request.getPricing())
                .availability(request.getAvailability())
                .build();

        TutorProfile saved = tutorProfileRepository.save(profile);
        return mapToResponse(saved);
    }

    /**
     * Fetch a tutor profile by user ID.
     */
    @Transactional(readOnly = true)
    public TutorProfileResponse getProfile(Long userId) {
        TutorProfile profile = tutorProfileRepository.findByIdWithUserAndSubjects(userId)
                .orElseThrow(() -> new RuntimeException("Tutor profile not found for user ID: " + userId));
        return mapToResponse(profile);
    }

    private TutorProfileResponse mapToResponse(TutorProfile profile) {
        return TutorProfileResponse.builder()
                .userId(profile.getUser().getId())
                .tutorName(profile.getUser().getName())
                .subjects(profile.getSubjects()) 
                .description(profile.getDescription())
                .pricing(profile.getPricing())
                .availability(profile.getAvailability())
                .build();
    }
}
