import React from "react";
import { ShieldCheck } from "lucide-react";
import { C } from "./tokens";

export const LandingFooter: React.FC = () => (
  <footer
    className="border-t py-10"
    style={{ backgroundColor: C.nearWhite, borderColor: C.lightTint }}
  >
    <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: C.darkTeal }}>
          <ShieldCheck className="w-3.5 h-3.5 text-white" strokeWidth={2} />
        </div>
        <span className="text-sm font-semibold font-display" style={{ color: C.darkTeal }}>
          Peerity
        </span>
      </div>

      {/* Links */}
      <div className="flex items-center gap-6">
        {["Privacy policy", "Terms of use", "Security"].map(label => (
          <span
            key={label}
            className="text-xs cursor-default"
            style={{ color: C.mutedText }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Copyright */}
      <p className="text-xs" style={{ color: C.mutedText }}>
        &copy; {new Date().getFullYear()} Peerity. Academic use only.
      </p>
    </div>
  </footer>
);
