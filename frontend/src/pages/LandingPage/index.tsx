/**
 * LandingPage — Peerity public marketing page
 *
 * Entirely standalone: no auth context, no authenticated-app imports.
 * Served at the root route "/" and visible to unauthenticated visitors.
 *
 * Deliberately exempt from the app's dark-mode toggle: it hardcodes a fixed
 * light brand palette (see ./tokens.ts) via inline styles rather than Tailwind
 * dark: classes, and index.css's "Landing Page Light Theme Preservation" block
 * (.landing-page / .landing-header selectors) explicitly keeps it light even
 * when html.dark is set — the same way a marketing site's brand presentation
 * commonly stays independent of an authenticated app's theme preference.
 *
 * Sections (in DOM order):
 *   1. LandingNav        — logo + "Sign In" button
 *   2. HeroSection        — headline + CTA + product mockup panel
 *   3. FeaturesSection    — 3-card feature grid (anchor: #features)
 *   4. HowItWorksSection  — 4-step flow (anchor: #how-it-works)
 *   5. SecuritySection    — encryption + multi-party disclosure (anchor: #security)
 *   6. LandingFooter      — minimal footer
 */

import React from "react";
import { C } from "./tokens";
import { LandingNav } from "./LandingNav";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { SecuritySection } from "./SecuritySection";
import { LandingFooter } from "./LandingFooter";

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page min-h-screen" style={{ backgroundColor: C.nearWhite, scrollBehavior: "smooth" }}>
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SecuritySection />
      </main>
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
