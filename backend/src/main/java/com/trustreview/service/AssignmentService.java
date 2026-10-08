package com.trustreview.service;

import com.trustreview.dto.AssignmentDto;
import com.trustreview.dto.CreateAssignmentRequest;
import com.trustreview.model.Assignment;
import com.trustreview.model.Role;
import com.trustreview.model.User;
import com.trustreview.repository.AssignmentRepository;
import com.trustreview.repository.SubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;

    public AssignmentService(AssignmentRepository assignmentRepository,
                             SubmissionRepository submissionRepository) {
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
    }

    @Transactional
    public AssignmentDto create(CreateAssignmentRequest req, User creator) {
        if (req.getReviewDeadline() != null && req.getDeadline() != null && req.getReviewDeadline().isBefore(req.getDeadline())) {
            throw new IllegalArgumentException("Review deadline cannot be before submission deadline.");
        }

        String rubricJson;
        if (req.getRubric() != null && !req.getRubric().isEmpty()) {
            rubricJson = RubricSupport.toJson(RubricSupport.normalize(req.getRubric()));
        } else if (req.getRubricCriteria() != null && !req.getRubricCriteria().isBlank()) {
            if (RubricSupport.parse(req.getRubricCriteria()).isEmpty()) {
                throw new IllegalArgumentException("At least one rubric criterion is required.");
            }
            rubricJson = req.getRubricCriteria().trim();
        } else {
            throw new IllegalArgumentException("Rubric criteria are required.");
        }

        Assignment a = new Assignment();
        a.setTitle(req.getTitle());
        a.setDescription(req.getDescription());
        a.setRubricCriteria(rubricJson);
        a.setDeadline(req.getDeadline());
        LocalDateTime revDeadline = req.getReviewDeadline() != null
                ? req.getReviewDeadline()
                : (req.getDeadline() != null ? req.getDeadline().plusDays(7) : null);
        a.setReviewDeadline(revDeadline);
        a.setCreatedBy(creator);
        return AssignmentDto.from(assignmentRepository.save(a), false);
    }

    @Transactional(readOnly = true)
    public List<AssignmentDto> findAll(User currentUser) {
        List<Assignment> assignments = assignmentRepository.findAllByOrderByCreatedAtDesc();

        Set<String> submittedAssignmentIds = Collections.emptySet();
        if (currentUser != null && currentUser.getRole() == Role.STUDENT) {
            submittedAssignmentIds = submissionRepository.findByAuthorOrderBySubmittedAtDesc(currentUser)
                    .stream()
                    .map(s -> s.getAssignment().getId())
                    .collect(Collectors.toSet());
        }

        final Set<String> finalSubmittedIds = submittedAssignmentIds;
        return assignments.stream()
                .map(a -> AssignmentDto.from(a, finalSubmittedIds.contains(a.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AssignmentDto> findAll() {
        return findAll(null);
    }

    @Transactional(readOnly = true)
    public Optional<AssignmentDto> findById(String id, User currentUser) {
        return assignmentRepository.findById(id).map(a -> {
            boolean hasSubmitted = false;
            if (currentUser != null && currentUser.getRole() == Role.STUDENT) {
                hasSubmitted = submissionRepository.existsByAuthorAndAssignment(currentUser, a);
            }
            return AssignmentDto.from(a, hasSubmitted);
        });
    }

    @Transactional(readOnly = true)
    public Optional<AssignmentDto> findById(String id) {
        return findById(id, null);
    }

    @Transactional(readOnly = true)
    public Optional<Assignment> findEntityById(String id) {
        return assignmentRepository.findById(id);
    }
}
