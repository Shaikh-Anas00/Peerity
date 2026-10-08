import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/userApi';
import {
  User as UserIcon,
  Building,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Edit3,
  CheckCircle,
  AlertCircle,
  Camera,
  Save,
  X,
  Lock,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { ContentHeader, StatusPill } from '../components/ContentHeader';

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

export const ProfilePage: React.FC = () => {
  const { user, updateUserState } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [institution, setInstitution] = useState(user?.institution || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [academicStanding, setAcademicStanding] = useState(user?.academicStanding || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  if (!user) return null;

  const isProfileComplete = Boolean(
    user.fullName?.trim() && user.institution?.trim() && user.department?.trim()
  );

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleStartEditing = () => {
    setFullName(user.fullName || '');
    setInstitution(user.institution || '');
    setDepartment(user.department || '');
    setAcademicStanding(user.academicStanding || '');
    setAvatarUrl(user.avatarUrl || '');
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !institution.trim() || !department.trim()) {
      showToast("Full Name, Institution, and Department are strictly required.", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await userApi.updateProfile({
        fullName: fullName.trim(),
        institution: institution.trim(),
        department: department.trim(),
        academicStanding: academicStanding.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });

      updateUserState(res.data);
      setIsEditing(false);
      showToast("Profile successfully updated.", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-body space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <ContentHeader
        breadcrumbs={["Account", "User Profile"]}
        title="My Profile"
        subtitle="Manage your identity, academic affiliation, and Level 3 progressive disclosure settings."
        icon={UserIcon}
        statusPill={
          isProfileComplete ? (
            <StatusPill label="REGISTRATION COMPLETE" variant="success" icon={CheckCircle} />
          ) : (
            <StatusPill label="PROFILE INCOMPLETE" variant="warning" icon={AlertCircle} />
          )
        }
        actions={
          !isEditing ? (
            <button
              onClick={handleStartEditing}
              className="flex items-center gap-1.5 px-4 py-2 bg-peerity-800 hover:bg-peerity-600 text-white rounded-lg text-sm font-semibold transition shadow-sm font-display"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          ) : undefined
        }
      />

      {/* Incomplete profile alert banner */}
      {!isProfileComplete && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-900 font-display">Required Profile Information Missing</h3>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              To participate in course evaluations and peer reviews, your <strong>Institution</strong> and <strong>Department</strong> must be completed.
              Access to reviews and assignments is gated until these required fields are provided.
            </p>
            {!isEditing && (
              <button
                onClick={handleStartEditing}
                className="mt-2.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold font-display shadow-xs transition"
              >
                Complete Profile Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE */}
      {!isEditing ? (
        <div className="space-y-6">
          {/* Main Profile Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-teal-400 text-3xl font-extrabold font-display shadow-sm">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
                <button
                  onClick={handleStartEditing}
                  title="Change avatar"
                  className="absolute -bottom-2 -right-2 p-1.5 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 transition"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Core Info */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display tracking-tight truncate">
                    {user.fullName}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-teal-400 border border-slate-200 dark:border-slate-700 font-display">
                    {user.role}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">{user.email}</p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4 text-xs text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <strong>Institution:</strong> {user.institution || "Unset"}
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <strong>Department:</strong> {user.department || "Unset"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Fields Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Required Enrollment Data */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">Required Registration Fields</h3>
              </div>
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Full Legal Name</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{user.fullName || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Institution</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{user.institution || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Department</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{user.department || "—"}</p>
                </div>
              </div>
            </div>

            {/* Level 3 Progressive Disclosure: Academic Standing */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">Level 3 Disclosure: Academic Standing</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold rounded-md border border-purple-200 dark:border-purple-800/50 font-display">
                  TIER 3 GATE
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Academic Standing / Cohort</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                    {user.academicStanding || <span className="text-slate-400 italic">Not specified (optional)</span>}
                  </p>
                </div>
                <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 rounded-xl text-purple-900 dark:text-purple-200 mt-3 leading-relaxed">
                  <p className="text-[11px]">
                    <strong>Privacy Boundary:</strong> Under Peerity's policy engine, this field corresponds to <code>DisclosureLevel.LEVEL_3_ACADEMIC_STANDING</code>. It remains strictly hidden during regular peer evaluations and is only unlocked if a committee quorum votes to approve Level 3 disclosure on an appeal.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Legal Protection Notice */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display mb-1">
                Data Minimization Guarantee (Zero Legal Exposure)
              </h4>
              <p>
                In strict compliance with student privacy principles (COPPA/GDPR special-category guidelines), Peerity deliberately <strong>does not collect, store, or process</strong> age, gender, date of birth, phone numbers, or residential addresses. All evaluation operations rely strictly on cryptographic pseudonyms and isolated course metadata.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* EDIT MODE */
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">Edit Profile Details</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Update required affiliation fields and optional Level 3 academic standing.</p>
            </div>
            <button
              type="button"
              onClick={handleCancelEditing}
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
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                Institution <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                Department <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                Academic Standing / Year <span className="text-slate-400 font-normal">(Optional — Level 3 Disclosure)</span>
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                Profile Photo URL <span className="text-slate-400 font-normal">(Optional — Default avatar if unset)</span>
              </label>
              <div className="relative">
                <Camera className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                <span className="text-[11px] text-slate-400">Presets:</span>
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
                    onClick={() => setAvatarUrl('')}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline ml-1"
                  >
                    Clear (use default)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleCancelEditing}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition font-display"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-peerity-800 hover:bg-peerity-700 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-lg text-sm font-semibold transition shadow-sm font-display disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProfilePage;
