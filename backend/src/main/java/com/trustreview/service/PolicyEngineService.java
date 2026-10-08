package com.trustreview.service;

import com.trustreview.dto.DisclosedIdentityDto;
import com.trustreview.model.AppealReason;
import com.trustreview.model.DisclosureLevel;
import com.trustreview.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Automated minimum-necessary progressive disclosure policy engine.
 * Enforces strict boundary rules preventing over-disclosure beyond the permissible severity tier.
 */
@Service
public class PolicyEngineService {

    private static final Logger logger = LoggerFactory.getLogger(PolicyEngineService.class);

    /**
     * Determines the maximum policy-recommended disclosure level for an appeal reason.
     */
    public DisclosureLevel getRecommendedLevel(AppealReason reason) {
        if (reason == null) {
            return DisclosureLevel.LEVEL_0_ANONYMOUS;
        }

        return switch (reason) {
            case HARASSMENT_OR_ABUSE -> DisclosureLevel.LEVEL_4_FULL_IDENTITY;
            case FACTUAL_FABRICATION -> DisclosureLevel.LEVEL_3_ACADEMIC_STANDING;
            case UNFAIR_GRADING_OUTLIER -> DisclosureLevel.LEVEL_2_INSTITUTION_DEPT;
            case PROCEDURAL_ERROR -> DisclosureLevel.LEVEL_1_ELIGIBILITY;
        };
    }

    /**
     * Validates that requestedLevel does not exceed the policy-prescribed maximum tier for the reason.
     */
    public boolean isPermitted(DisclosureLevel requestedLevel, AppealReason reason) {
        if (requestedLevel == null || reason == null) {
            return false;
        }
        DisclosureLevel maxPermitted = getRecommendedLevel(reason);
        return requestedLevel.getRank() <= maxPermitted.getRank();
    }

    /**
     * Enforces the policy boundary. Throws IllegalArgumentException if violation detected.
     */
    public void validateBoundary(DisclosureLevel requestedLevel, AppealReason reason) {
        if (!isPermitted(requestedLevel, reason)) {
            DisclosureLevel maxPermitted = getRecommendedLevel(reason);
            logger.warn("Policy boundary violation attempt: requested={}, maxPermitted={} for reason={}",
                    requestedLevel, maxPermitted, reason);
            throw new IllegalArgumentException(String.format(
                    "Policy Boundary Violation: Requested disclosure level '%s' (rank %d) exceeds maximum permissible tier '%s' (rank %d) for appeal reason '%s'.",
                    requestedLevel, requestedLevel.getRank(), maxPermitted, maxPermitted.getRank(), reason
            ));
        }
    }

    /**
     * Formulates progressive disclosure response strictly bounded by approved level.
     */

    /**
     * Generates an objective, non-prejudicial statistical signal note for Committee review.
     * Only generated if reviewer has sufficient calibration samples (>= 2).
     */
    public String evaluateStatisticalSignal(Double reliabilityScore, Integer sampleCount, Double helpfulnessPercentage) {
        if (sampleCount == null || sampleCount < 2 || reliabilityScore == null) {
            return null;
        }

        if (reliabilityScore < 65.0) {
            return String.format(
                    "Statistical signal: Reviewer calibration accuracy is %.1f%% across %d benchmark samples (below course baseline) — consider this alongside review text.",
                    reliabilityScore, sampleCount
            );
        }
        return null;
    }

    public DisclosedIdentityDto buildDisclosedIdentity(
            User reviewer,
            String pseudonym,
            DisclosureLevel level,
            boolean isApproved,
            int reviewsCompleted,
            String courseName) {

        DisclosedIdentityDto dto = new DisclosedIdentityDto();
        dto.setPseudonym(pseudonym != null ? pseudonym : "Anonymous Reviewer");
        dto.setLevel(level);
        dto.setApproved(isApproved);

        // If not approved, strictly anonymous Level 0
        if (!isApproved || level == null || level == DisclosureLevel.LEVEL_0_ANONYMOUS) {
            return dto;
        }

        int rank = level.getRank();

        // Level 1: Eligibility & Course
        if (rank >= 1) {
            dto.setEligibilityStatus(reviewer != null && reviewer.isActive() ? "Verified Enrolled Student" : "Inactive");
            dto.setCourse(courseName != null ? courseName : "Web Technologies");
        }

        // Level 2: Institution & Department
        if (rank >= 2 && reviewer != null) {
            dto.setInstitution(reviewer.getInstitution() != null ? reviewer.getInstitution() : "Institutional Affiliate");
            dto.setDepartment(reviewer.getDepartment() != null ? reviewer.getDepartment() : "Academic Department");
        }

        // Level 3: Academic Standing & Review History
        if (rank >= 3 && reviewer != null) {
            dto.setAcademicStanding("Year 3 Undergraduate");
            dto.setReviewsCompleted(reviewsCompleted);
        }

        // Level 4: Full Legal Identity & Email
        if (rank >= 4 && reviewer != null) {
            dto.setFullName(reviewer.getFullName());
            dto.setEmail(reviewer.getEmail());
        }

        return dto;
    }
}