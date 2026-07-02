package com.clarifyr.config;

import com.clarifyr.entity.TutorProfile;
import com.clarifyr.entity.User;
import com.clarifyr.entity.UserRole;
import com.clarifyr.repository.TutorProfileRepository;
import com.clarifyr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;

/**
 * Data Seeder to populate demo accounts and realistic profiles on startup.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TutorProfileRepository tutorProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking database for seed data...");

        // 1. Seed Demo Student
        if (!userRepository.existsByEmail("student@clarifyr.com")) {
            log.info("Seeding demo student: student@clarifyr.com");
            User student = User.builder()
                    .name("Demo Student")
                    .email("student@clarifyr.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(UserRole.STUDENT)
                    .build();
            userRepository.save(student);
        }

        // 2. Seed Demo Tutor
        if (!userRepository.existsByEmail("tutor@clarifyr.com")) {
            log.info("Seeding demo tutor: tutor@clarifyr.com");
            User tutorUser = User.builder()
                    .name("Jane Doe (Java & Web Dev)")
                    .email("tutor@clarifyr.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(UserRole.TUTOR)
                    .build();
            tutorUser = userRepository.save(tutorUser);

            TutorProfile tutorProfile = TutorProfile.builder()
                    .user(tutorUser)
                    .subjects(Arrays.asList("Java", "Spring Boot", "Web Development", "MySQL"))
                    .description("Experienced software engineer passionate about mentoring students in backend architectures, clean code, database design, and full-stack systems. Let's solve your coding doubts together!")
                    .pricing(45.0)
                    .availability("Weekdays 6 PM - 9 PM, Saturdays 10 AM - 4 PM")
                    .build();
            tutorProfileRepository.save(tutorProfile);
        }

        // 3. Seed Additional Realistic Tutor: Alex Rivera
        if (!userRepository.existsByEmail("alex.tutor@clarifyr.com")) {
            log.info("Seeding tutor: alex.tutor@clarifyr.com");
            User alexUser = User.builder()
                    .name("Alex Rivera (Math & Physics)")
                    .email("alex.tutor@clarifyr.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(UserRole.TUTOR)
                    .build();
            alexUser = userRepository.save(alexUser);

            TutorProfile alexProfile = TutorProfile.builder()
                    .user(alexUser)
                    .subjects(Arrays.asList("Mathematics", "Physics", "Calculus", "Linear Algebra"))
                    .description("University math instructor specializing in Calculus I-III, Linear Algebra, and AP Physics. I believe in learning by understanding principles, not just memorizing formulas. Book a session to clarify your math and science questions!")
                    .pricing(35.0)
                    .availability("Tuesdays & Thursdays 4 PM - 8 PM, Sundays 12 PM - 5 PM")
                    .build();
            tutorProfileRepository.save(alexProfile);
        }

        // 4. Seed Additional Realistic Tutor: Sarah Jenkins
        if (!userRepository.existsByEmail("sarah.tutor@clarifyr.com")) {
            log.info("Seeding tutor: sarah.tutor@clarifyr.com");
            User sarahUser = User.builder()
                    .name("Sarah Jenkins (UI/UX Design)")
                    .email("sarah.tutor@clarifyr.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(UserRole.TUTOR)
                    .build();
            sarahUser = userRepository.save(sarahUser);

            TutorProfile sarahProfile = TutorProfile.builder()
                    .user(sarahUser)
                    .subjects(Arrays.asList("UI/UX Design", "Figma", "HTML & CSS", "Responsive Design"))
                    .description("Product designer with 5+ years of experience working with top tech companies. I teach practical design principles, wireframing in Figma, and frontend styling. Perfect for students looking to improve their UI layout skills and portfolio pieces.")
                    .pricing(40.0)
                    .availability("Mondays & Wednesdays 3 PM - 7 PM, Saturdays 11 AM - 3 PM")
                    .build();
            tutorProfileRepository.save(sarahProfile);
        }

        log.info("Database seeding complete.");
    }
}
