package com.trustreview.controller;

import com.trustreview.dto.ApiResponse;
import com.trustreview.dto.RubricTemplateDto;
import com.trustreview.repository.RubricTemplateRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/** Read-only access to starter rubric templates, for staff who author assignments. */
@RestController
@RequestMapping("/api/rubric-templates")
public class RubricTemplateController {

    private final RubricTemplateRepository templateRepository;

    public RubricTemplateController(RubricTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    /** GET /api/rubric-templates - INSTRUCTOR or ADMIN. */
    @GetMapping
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<List<RubricTemplateDto>> list() {
        return ResponseEntity.ok(templateRepository.findAllByOrderByNameAsc().stream()
                .map(RubricTemplateDto::from)
                .collect(Collectors.toList()));
    }

    /** GET /api/rubric-templates/{id} - INSTRUCTOR or ADMIN. */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<?> get(@PathVariable String id) {
        return templateRepository.findById(id)
                .<ResponseEntity<?>>map(t -> ResponseEntity.ok(RubricTemplateDto.from(t)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(false, "Rubric template not found")));
    }
}
