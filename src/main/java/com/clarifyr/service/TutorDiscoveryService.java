package com.clarifyr.service;

import com.clarifyr.dto.TutorProfileResponse;
import com.clarifyr.entity.TutorProfile;
import com.clarifyr.repository.TutorProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service for discovering tutors.
 */
@Service
@RequiredArgsConstructor
public class TutorDiscoveryService {

    private final TutorProfileRepository tutorProfileRepository;

    /**
     * Get all tutors.
     */
    @Transactional(readOnly = true)
    public List<TutorProfileResponse> getAllTutors() {
        return tutorProfileRepository.findAllWithUserAndSubjects().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Search tutors by subject or description keyword.
     */
    @Transactional(readOnly = true)
    public List<TutorProfileResponse> searchTutors(String subject, String query) {
        Collection<TutorProfile> profiles;

        if (subject != null && !subject.isBlank()) {
            profiles = tutorProfileRepository.findBySubject(subject);
        } else if (query != null && !query.isBlank()) {
            profiles = tutorProfileRepository.searchByDescription(query);
        } else {
            profiles = tutorProfileRepository.findAllWithUserAndSubjects();
        }

        return profiles.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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
