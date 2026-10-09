package com.trustreview.config;

import com.trustreview.model.*;
import com.trustreview.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import com.trustreview.dto.PerformanceLevelDto;
import com.trustreview.dto.RubricCriterionDto;
import com.trustreview.service.RubricSupport;

@Component
@Profile("!test")
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final CalibrationSampleRepository calibrationSampleRepository;
    private final AssignmentRepository assignmentRepository;
    private final GroupRepository groupRepository;
    private final GroupMembershipRepository groupMembershipRepository;
    private final GroupMemberEvaluationRepository evaluationRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           CalibrationSampleRepository calibrationSampleRepository,
                           AssignmentRepository assignmentRepository,
                           GroupRepository groupRepository,
                           GroupMembershipRepository groupMembershipRepository,
                           GroupMemberEvaluationRepository evaluationRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.calibrationSampleRepository = calibrationSampleRepository;
        this.assignmentRepository = assignmentRepository;
        this.groupRepository = groupRepository;
        this.groupMembershipRepository = groupMembershipRepository;
        this.evaluationRepository = evaluationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        logger.info("Verifying Peerity seed accounts (Admin, Committee, Instructors, Students)...");

        // Seed primary Peerity accounts
        seedUserIfAbsent("admin@peerity.edu", "Admin@12345", "Dr. Alistair Vance", Role.ADMIN, "Apex Institute of Technology", "Administration & Governance");
        seedUserIfAbsent("committee1@peerity.edu", "Committee@12345", "Prof. Elena Rostova", Role.COMMITTEE, "Apex Institute of Technology", "Academic Integrity Committee");
        seedUserIfAbsent("committee2@peerity.edu", "Committee@12345", "Dr. Marcus Sterling", Role.COMMITTEE, "Apex Institute of Technology", "Ethics & Adjudication Panel");
        seedUserIfAbsent("committee3@peerity.edu", "Committee@12345", "Dr. Priya Sundaram", Role.COMMITTEE, "Apex Institute of Technology", "Appeals Board");
        seedUserIfAbsent("instructor1@peerity.edu", "Instructor@12345", "Prof. Jonathan Hayes", Role.INSTRUCTOR, "Apex Institute of Technology", "Computer Science");
        seedUserIfAbsent("instructor2@peerity.edu", "Instructor@12345", "Dr. Sarah Jenkins", Role.INSTRUCTOR, "Apex Institute of Technology", "Software Engineering");
        seedUserIfAbsent("student1@peerity.edu", "Student@12345", "Alice Chen", Role.STUDENT, "Apex Institute of Technology", "Computer Science");
        seedUserIfAbsent("student2@peerity.edu", "Student@12345", "Bob Martinez", Role.STUDENT, "Apex Institute of Technology", "Information Systems");
        seedUserIfAbsent("student3@peerity.edu", "Student@12345", "Chloe Dupont", Role.STUDENT, "Apex Institute of Technology", "Cybersecurity");
        seedUserIfAbsent("student4@peerity.edu", "Student@12345", "David Kim", Role.STUDENT, "Apex Institute of Technology", "Data Science");

        // Backward compatibility for legacy tests/profiles
        seedUserIfAbsent("admin@trustreview.edu", "Admin@12345", "Dr. Alistair Vance", Role.ADMIN, "Apex Institute of Technology", "Administration & Governance");
        seedUserIfAbsent("committee1@trustreview.edu", "Committee@12345", "Prof. Elena Rostova", Role.COMMITTEE, "Apex Institute of Technology", "Academic Integrity Committee");
        seedUserIfAbsent("instructor1@trustreview.edu", "Instructor@12345", "Prof. Jonathan Hayes", Role.INSTRUCTOR, "Apex Institute of Technology", "Computer Science");
        seedUserIfAbsent("student1@trustreview.edu", "Student@12345", "Alice Chen", Role.STUDENT, "Apex Institute of Technology", "Computer Science");

        seedAssignmentsIfAbsent();
        seedGroupsIfAbsent();

        logger.info("Peerity seed initialization complete.");
    }

    private void seedAssignmentsIfAbsent() {
        if (assignmentRepository.count() > 0) return;

        User instructor = userRepository.findByEmail("instructor1@peerity.edu")
                .or(() -> userRepository.findByEmail("instructor1@trustreview.edu"))
                .orElse(null);
        if (instructor == null) return;

        List<RubricCriterionDto> a1Rubric = List.of(
            new RubricCriterionDto("System Architecture", "Evaluation of system design and components", null, List.of(
                new PerformanceLevelDto("Exemplary", 10, "9-10", "Modular, decoupled components with flawless failure isolation."),
                new PerformanceLevelDto("Proficient", 8, "7-8", "Well-structured design with clear component responsibilities and minor coupling."),
                new PerformanceLevelDto("Developing", 6, "5-6", "Monolithic tendencies or incomplete component boundaries."),
                new PerformanceLevelDto("Needs Improvement", 2, "0-4", "Chaotic or unworkable architectural design.")
            )),
            new RubricCriterionDto("Consensus & Fault Tolerance", "Analysis of consensus protocol safety and liveness", null, List.of(
                new PerformanceLevelDto("Exemplary", 10, "9-10", "Rigorous proof of leader safety, log matching, and split-brain prevention."),
                new PerformanceLevelDto("Proficient", 8, "7-8", "Solid understanding of quorum consensus with minor partition recovery gaps."),
                new PerformanceLevelDto("Developing", 6, "5-6", "Identifies consensus basics but misses edge cases like partitioned leaders."),
                new PerformanceLevelDto("Needs Improvement", 2, "0-4", "Flawed understanding; vulnerable to split-brain or data loss.")
            )),
            new RubricCriterionDto("Scalability Analysis", "Evaluation of throughput, latency, and replication overhead", null, List.of(
                new PerformanceLevelDto("Exemplary", 10, "9-10", "Comprehensive benchmarks under varying load, network delays, and node counts."),
                new PerformanceLevelDto("Proficient", 8, "7-8", "Accurate scalability curves with reasonable latency trade-off analysis."),
                new PerformanceLevelDto("Developing", 6, "5-6", "Surface-level analysis lacking stress testing or bottleneck detection."),
                new PerformanceLevelDto("Needs Improvement", 2, "0-4", "No empirical or theoretical scalability evaluation.")
            )),
            new RubricCriterionDto("Clarity & Academic Rigor", "Quality of technical writing, citations, and clarity", null, List.of(
                new PerformanceLevelDto("Exemplary", 10, "9-10", "Publication-grade writing, pristine diagrams, and thorough bibliography."),
                new PerformanceLevelDto("Proficient", 8, "7-8", "Clear, professional write-up with appropriate technical terminology."),
                new PerformanceLevelDto("Developing", 6, "5-6", "Informal tone, ambiguous phrasing, or insufficient citations."),
                new PerformanceLevelDto("Needs Improvement", 2, "0-4", "Poorly written, incomprehensible diagrams, or missing references.")
            ))
        );

        Assignment a1 = new Assignment();
        a1.setTitle("Distributed Systems Architecture Report");
        a1.setDescription("Analyze consensus protocols, fault-tolerance guarantees, and replication trade-offs in modern distributed datastores.");
        a1.setRubricCriteria(RubricSupport.toJson(a1Rubric));
        a1.setDeadline(java.time.LocalDateTime.now().plusDays(14));
        a1.setReviewDeadline(java.time.LocalDateTime.now().plusDays(21));
        a1.setCreatedBy(instructor);
        assignmentRepository.save(a1);

        List<RubricCriterionDto> a2Rubric = List.of(
            new RubricCriterionDto("Threat Modeling", "Identification of STRIDE threat vectors and trust boundaries", null, List.of(
                new PerformanceLevelDto("Exemplary", 10, "9-10", "Exhaustive STRIDE breakdown across all attack surfaces."),
                new PerformanceLevelDto("Proficient", 8, "7-8", "Identifies all critical threats with minor overlooked secondary vectors."),
                new PerformanceLevelDto("Developing", 6, "5-6", "Generic threat list missing application-specific attack surfaces."),
                new PerformanceLevelDto("Needs Improvement", 2, "0-4", "Superficial or absent threat model.")
            )),
            new RubricCriterionDto("Cryptographic Implementation", "Use of authenticated encryption, keys, and CSPRNG", null, List.of(
                new PerformanceLevelDto("Exemplary", 10, "9-10", "Flawless AES-256-GCM / ChaCha20-Poly1305 with secure key rotation."),
                new PerformanceLevelDto("Proficient", 8, "7-8", "Modern cipher suites correctly used; minor key lifecycle gaps."),
                new PerformanceLevelDto("Developing", 6, "5-6", "Deprecated algorithms (e.g. CBC without HMAC) or hardcoded secrets."),
                new PerformanceLevelDto("Needs Improvement", 2, "0-4", "Broken crypto, plaintext sensitive data, or roll-your-own algorithms.")
            )),
            new RubricCriterionDto("Authorization & RBAC", "Role-based access control and principle of least privilege", null, List.of(
                new PerformanceLevelDto("Exemplary", 10, "9-10", "Strict defense-in-depth authorization with zero BOLA/IDOR vulnerabilities."),
                new PerformanceLevelDto("Proficient", 8, "7-8", "Robust RBAC implementation with good permission granularity."),
                new PerformanceLevelDto("Developing", 6, "5-6", "Coarse permissions susceptible to privilege escalation."),
                new PerformanceLevelDto("Needs Improvement", 2, "0-4", "Broken object level authorization or missing access checks.")
            )),
            new RubricCriterionDto("Remediation Strategy", "Actionable, prioritized fix plans for discovered risks", null, List.of(
                new PerformanceLevelDto("Exemplary", 10, "9-10", "Prioritized CVE/CWE mitigation matrix with verification test cases."),
                new PerformanceLevelDto("Proficient", 8, "7-8", "Clear remediation recommendations with realistic timelines."),
                new PerformanceLevelDto("Developing", 6, "5-6", "Vague recommendations lacking implementation specifics."),
                new PerformanceLevelDto("Needs Improvement", 2, "0-4", "No remediation plan provided.")
            ))
        );

        Assignment a2 = new Assignment();
        a2.setTitle("Web Security & Cryptographic Audit");
        a2.setDescription("Perform an end-to-end security review focusing on authenticated encryption at rest, session integrity, and strict access controls.");
        a2.setRubricCriteria(RubricSupport.toJson(a2Rubric));
        a2.setDeadline(java.time.LocalDateTime.now().plusDays(10));
        a2.setReviewDeadline(java.time.LocalDateTime.now().plusDays(17));
        a2.setCreatedBy(instructor);
        assignmentRepository.save(a2);

        // Seed a benchmark calibration sample
        if (calibrationSampleRepository.count() == 0) {
            CalibrationSample sample = new CalibrationSample();
            sample.setAssignment(a1);
            sample.setTitle("Benchmark: Distributed Datastore Consensus Protocol");
            sample.setDescription("Instructor-scored sample analysis of Raft consensus with log compaction.");
            sample.setSampleContent("This submission evaluates the leader election safety and log matching property under network partitions...");
            sample.setExpertScores("{\"System Architecture\":8,\"Consensus & Fault Tolerance\":8,\"Scalability Analysis\":8,\"Clarity & Academic Rigor\":10}");
            sample.setExpertFeedback("Thorough explanation of split-brain prevention, though partition recovery latency analysis could be expanded.");
            sample.setCreatedBy(instructor);
            calibrationSampleRepository.save(sample);
        }
        logger.info("Seeded realistic course assignments and calibration sample.");
    }

    private void seedGroupsIfAbsent() {
        if (groupRepository.count() > 0) return;

        User instructor = userRepository.findByEmail("instructor1@peerity.edu")
                .or(() -> userRepository.findByEmail("instructor1@trustreview.edu"))
                .orElse(null);
        User student1 = userRepository.findByEmail("student1@peerity.edu").orElse(null);
        User student2 = userRepository.findByEmail("student2@peerity.edu").orElse(null);
        User student3 = userRepository.findByEmail("student3@peerity.edu").orElse(null);
        User student4 = userRepository.findByEmail("student4@peerity.edu").orElse(null);

        if (instructor == null || student1 == null || student2 == null) return;

        // Find an assignment to associate groups with
        List<Assignment> assignments = assignmentRepository.findAll();
        Assignment assignment = assignments.isEmpty() ? null : assignments.get(0);

        // Group Alpha — 3 active members (enough for feedback disclosure)
        Group alpha = new Group();
        alpha.setName("Team Alpha");
        alpha.setDescription("Distributed systems analysis team focusing on consensus protocol evaluation.");
        alpha.setStatus(GroupStatus.ACTIVE);
        if (assignment != null) alpha.setAssignment(assignment);
        groupRepository.save(alpha);

        addMembership(alpha, student1, MembershipRole.LEADER, MembershipStatus.ACTIVE);
        addMembership(alpha, student2, MembershipRole.MEMBER, MembershipStatus.ACTIVE);
        if (student3 != null) addMembership(alpha, student3, MembershipRole.MEMBER, MembershipStatus.ACTIVE);

        // Group Beta — 2 members + 1 pending (forming status)
        Group beta = new Group();
        beta.setName("Team Beta");
        beta.setDescription("Security audit team specialising in cryptographic implementation review.");
        beta.setStatus(GroupStatus.FORMING);
        if (assignments.size() > 1) beta.setAssignment(assignments.get(1));
        groupRepository.save(beta);

        addMembership(beta, student2, MembershipRole.LEADER, MembershipStatus.ACTIVE);
        if (student3 != null) addMembership(beta, student3, MembershipRole.MEMBER, MembershipStatus.ACTIVE);
        if (student4 != null) addMembership(beta, student4, MembershipRole.MEMBER, MembershipStatus.PENDING);

        // Group Gamma — Machine Learning & Differential Privacy (ACTIVE, 3 members)
        Group gamma = new Group();
        gamma.setName("Team Gamma");
        gamma.setDescription("Machine Learning & Differential Privacy Research Group evaluating federated gradient protection.");
        gamma.setStatus(GroupStatus.ACTIVE);
        if (assignment != null) gamma.setAssignment(assignment);
        groupRepository.save(gamma);

        if (student3 != null) addMembership(gamma, student3, MembershipRole.LEADER, MembershipStatus.ACTIVE);
        addMembership(gamma, student1, MembershipRole.MEMBER, MembershipStatus.ACTIVE);
        if (student4 != null) addMembership(gamma, student4, MembershipRole.MEMBER, MembershipStatus.ACTIVE);

        // Group Delta — Cloud Microservices & Distributed Architecture (FORMING, 3 members)
        Group delta = new Group();
        delta.setName("Team Delta");
        delta.setDescription("Cloud Microservices & Distributed Architecture Working Group designing event-driven resilient backbones.");
        delta.setStatus(GroupStatus.FORMING);
        if (assignments.size() > 1) delta.setAssignment(assignments.get(1));
        groupRepository.save(delta);

        if (student4 != null) addMembership(delta, student4, MembershipRole.LEADER, MembershipStatus.ACTIVE);
        addMembership(delta, student1, MembershipRole.MEMBER, MembershipStatus.PENDING);
        addMembership(delta, student2, MembershipRole.MEMBER, MembershipStatus.PENDING);

        // Seed rich evaluations for Team Alpha
        if (evaluationRepository.count() == 0 && student3 != null) {
            GroupMemberEvaluation eval1 = new GroupMemberEvaluation();
            eval1.setGroup(alpha);
            eval1.setEvaluator(student2);
            eval1.setEvaluatee(student1);
            eval1.setScores("{\"Contribution\":9,\"Communication\":8,\"Reliability\":9,\"Teamwork\":9}");
            eval1.setFeedback("Bob demonstrated exceptional mastery of the network partition testbed and consistently attended syncs.");
            evaluationRepository.save(eval1);

            GroupMemberEvaluation eval2 = new GroupMemberEvaluation();
            eval2.setGroup(alpha);
            eval2.setEvaluator(student3);
            eval2.setEvaluatee(student1);
            eval2.setScores("{\"Contribution\":8,\"Communication\":9,\"Reliability\":8,\"Teamwork\":9}");
            eval2.setFeedback("Chloe provided insightful analysis on the Raft log compaction edge cases and documented all RPC payloads.");
            evaluationRepository.save(eval2);

            if (student4 != null) {
                GroupMemberEvaluation eval3 = new GroupMemberEvaluation();
                eval3.setGroup(alpha);
                eval3.setEvaluator(student4);
                eval3.setEvaluatee(student1);
                eval3.setScores("{\"Contribution\":10,\"Communication\":9,\"Reliability\":10,\"Teamwork\":9}");
                eval3.setFeedback("Alice guided the team architecture seamlessly and kept code reviews punctual and constructive.");
                evaluationRepository.save(eval3);
            }
        }

        logger.info("Seeded 4 demo groups (Team Alpha, Beta, Gamma, Delta) with members and evaluations.");
    }

    private void addMembership(Group group, User user, MembershipRole role, MembershipStatus status) {
        if (groupMembershipRepository.findByGroupIdAndUserId(group.getId(), user.getId()).isPresent()) {
            return;
        }
        GroupMembership m = new GroupMembership();
        m.setGroup(group);
        m.setUser(user);
        m.setRole(role);
        m.setStatus(status);
        groupMembershipRepository.save(m);
    }

    private void seedUserIfAbsent(String email, String rawPassword, String fullName,
                                   Role role, String institution, String department) {
        if (userRepository.findByEmail(email).isEmpty()) {
            userRepository.save(new User(
                email,
                passwordEncoder.encode(rawPassword),
                fullName,
                role,
                institution,
                department
            ));
            logger.info("Seeded account: {}", email);
        }
    }
}
