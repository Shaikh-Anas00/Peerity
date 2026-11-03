package com.trustreview.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when the number of distinct submitters for an assignment is less than 3,
 * violating the k >= 3 anonymity floor required for safe peer review distribution.
 * Maps to HTTP 409 Conflict.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class InsufficientAnonymitySetException extends IllegalStateException {

    public InsufficientAnonymitySetException(String message) {
        super(message);
    }
}
