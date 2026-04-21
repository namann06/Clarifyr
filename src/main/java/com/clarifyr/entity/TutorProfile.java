package com.clarifyr.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

/**
 * Entity representing a Tutor's professional profile.
 * Linked 1:1 with the User entity.
 */
@Entity
@Table(name = "tutor_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TutorProfile {

    @Id
    private Long id;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @ElementCollection
    @CollectionTable(name = "tutor_subjects", joinColumns = @JoinColumn(name = "tutor_profile_id"))
    @Column(name = "subject")
    private List<String> subjects;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double pricing;

    private String availability; 
}
