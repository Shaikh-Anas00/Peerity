package com.trustreview.controller;

import com.trustreview.dto.ApiResponse;
import com.trustreview.dto.RubricTemplateDto;
import com.trustreview.repository.RubricTemplateRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Read-only access to starter rubric templates, for staff who author assignments. */
@RestController
@RequestMapping("/api/rubric-templates")
public class RubricTemplateController {

    private final RubricTemplateRepository templateRepository;

    public RubricTemplateController(RubricTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    /** GET /api/rubric-templates - INSTRUCTOR or ADMIN (paginated). */
    @GetMapping
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<Page<RubricTemplateDto>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(templateRepository.findAllByOrderByNameAsc(PageRequest.of(page, size))
                .map(RubricTemplateDto::from));
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
