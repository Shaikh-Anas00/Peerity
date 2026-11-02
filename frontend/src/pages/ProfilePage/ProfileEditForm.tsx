import React, { useState } from "react";
import {
  User as UserIcon,
  Building,
  BookOpen,
  GraduationCap,
  Save,
  X,
  Lock,
  Camera,
} from "lucide-react";
import { User } from "../../context/AuthContext";
import { Button } from "../../components/ui";

const ACADEMIC_STANDING_PRESETS = [
  "Year 1 / Freshman",
  "Year 2 / Sophomore",
  "Year 3 / Junior",
  "Year 4 / Senior",
  "Graduate / Master's",
  "Doctoral / PhD",
  "Continuing Education",
];

const DEFAULT_AVATARS = [
  "https://api.dicebear.com/7.x/identicon/svg?seed=Felix",
  "https://api.dicebear.com/7.x/identicon/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/identicon/svg?seed=Milo",
  "https://api.dicebear.com/7.x/identicon/svg?seed=Zoe",
  "https://api.dicebear.com/7.x/identicon/svg?seed=Leo",
];

export interface ProfileEditFormProps {
  user: User;
  saving: boolean;
  onCancel: () => void;
  onSave: (values: {
    fullName: string;
    institution: string;
    department: string;
    academicStanding: string;
    avatarUrl: string;
  }) => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ user, saving, onCancel, onSave }) => {
  const [fullName, setFullName] = useState(user.fullName || "");
  const [institution, setInstitution] = useState(user.institution || "");
  const [department, setDepartment] = useState(user.department || "");
  const [academicStanding, setAcademicStanding] = useState(user.academicStanding || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ fullName, institution, department, academicStanding, avatarUrl });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">Edit Profile Details</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Update required affiliation fields and optional Level 3 academic standing.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-display">
            Full Name <span className="text-rose-500 dark:text-rose-400">*</span>
          </label>
          <div className="relative">
            <UserIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
          </div>
        </div>

        {/* Email (read only) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-display">
            Institutional Email (Read-only)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              disabled
              value={user.email}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono"
            />
          </div>
        </div>

        {/* Institution */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-display">
            Institution <span className="text-rose-500 dark:text-rose-400">*</span>
          </label>
          <div className="relative">
            <Building className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. Stanford University"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
          </div>
        </div>

        {/* Department */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-display">
            Department <span className="text-rose-500 dark:text-rose-400">*</span>
          </label>
          <div className="relative">
            <BookOpen className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
          </div>
        </div>

        {/* Academic Standing (Optional: Level 3 Concept) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-display">
            Academic Standing / Year <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional — Level 3 Disclosure)</span>
          </label>
          <div className="relative">
            <GraduationCap className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={academicStanding}
              onChange={(e) => setAcademicStanding(e.target.value)}
              list="standing-presets"
              placeholder="e.g. Year 3 / Junior"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
            <datalist id="standing-presets">
              {ACADEMIC_STANDING_PRESETS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Framed as <code>LEVEL_3_ACADEMIC_STANDING</code>. Only disclosed if quorum committee votes to grant Tier 3 access.
          </p>
        </div>

        {/* Profile Photo / Avatar URL */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-display">
            Profile Photo URL <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional — Default avatar if unset)</span>
          </label>
          <div className="relative">
            <Camera className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
          </div>

          {/* Avatar quick presets */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Presets:</span>
            {DEFAULT_AVATARS.map((av, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAvatarUrl(av)}
                className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 hover:ring-2 hover:ring-teal-500 transition"
              >
                <img src={av} alt="Preset" className="w-full h-full object-cover" />
              </button>
            ))}
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl("")}
                className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 underline ml-1"
              >
                Clear (use default)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={saving} leftIcon={<Save className="w-4 h-4" />}>
          Save Profile
        </Button>
      </div>
    </form>
  );
};
