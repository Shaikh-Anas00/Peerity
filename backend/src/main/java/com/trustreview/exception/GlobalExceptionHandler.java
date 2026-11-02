package com.trustreview.exception;

import com.trustreview.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Standardizes the three exception-to-status mappings that most controllers were repeating
 * by hand: IllegalArgumentException -> 400, IllegalStateException -> 409, SecurityException
 * -> 403, all with the existing {@link ApiResponse} body shape.
 *
 * Several endpoints intentionally map one of these exceptions to a different status (e.g.
 * IllegalArgumentException -> 404 for "entity not found" in a handful of Appeal/Group/
 * Submission endpoints, or IllegalStateException -> 400 alongside IllegalArgumentException in
 * a couple of Review/Submission endpoints). Those methods keep their own local try/catch,
 * which Spring always prefers over this class-wide fallback — so this handler only ever
 * fires where no more specific handling exists.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(new ApiResponse(false, ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse> handleConflict(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiResponse(false, ex.getMessage()));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ApiResponse> handleForbidden(SecurityException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse(false, ex.getMessage()));
    }
}
