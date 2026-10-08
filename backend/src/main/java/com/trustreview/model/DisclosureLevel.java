package com.trustreview.model;

public enum DisclosureLevel {
    LEVEL_0_ANONYMOUS(0, "Anonymous Pseudonym Only"),
    LEVEL_1_ELIGIBILITY(1, "Eligibility & Enrollment Status"),
    LEVEL_2_INSTITUTION_DEPT(2, "Institution & Department"),
    LEVEL_3_ACADEMIC_STANDING(3, "Academic Standing & Review History"),
    LEVEL_4_FULL_IDENTITY(4, "Full Legal Identity & Email");

    private final int rank;
    private final String displayName;

    DisclosureLevel(int rank, String displayName) {
        this.rank = rank;
        this.displayName = displayName;
    }

    public int getRank() {
        return rank;
    }

    public String getDisplayName() {
        return displayName;
    }
}