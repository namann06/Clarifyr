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

        boolean hasSubject = subject != null && !subject.isBlank();
        boolean hasQuery = query != null && !query.isBlank();

        if (hasSubject && hasQuery) {
            profiles = tutorProfileRepository.findBySubject(subject).stream()
                    .filter(tp -> (tp.getDescription() != null && tp.getDescription().toLowerCase().contains(query.toLowerCase()))
                            || (tp.getUser().getName() != null && tp.getUser().getName().toLowerCase().contains(query.toLowerCase()))
                            || (tp.getSubjects() != null && tp.getSubjects().stream().anyMatch(s -> s.toLowerCase().contains(query.toLowerCase()))))
                    .collect(Collectors.toSet());
        } else if (hasSubject) {
            profiles = tutorProfileRepository.findBySubject(subject);
        } else if (hasQuery) {
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
