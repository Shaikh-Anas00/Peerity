import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { userApi } from "../../api/userApi";
import {
  User as UserIcon,
  Edit3,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { ContentHeader, StatusPill } from "../../components/ContentHeader";
import { Button } from "../../components/ui";
import { ProfileView } from "./ProfileView";
import { ProfileEditForm } from "./ProfileEditForm";

export const ProfilePage: React.FC = () => {
  const { user, updateUserState } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  if (!user) return null;

  const isProfileComplete = Boolean(
    user.fullName?.trim() && user.institution?.trim() && user.department?.trim()
  );

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async (values: {
    fullName: string;
    institution: string;
    department: string;
    academicStanding: string;
    avatarUrl: string;
  }) => {
    if (!values.fullName.trim() || !values.institution.trim() || !values.department.trim()) {
      showToast("Full Name, Institution, and Department are strictly required.", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await userApi.updateProfile({
        fullName: values.fullName.trim(),
        institution: values.institution.trim(),
        department: values.department.trim(),
        academicStanding: values.academicStanding.trim() || undefined,
        avatarUrl: values.avatarUrl.trim() || undefined,
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
            <Button variant="primary" onClick={() => setIsEditing(true)} leftIcon={<Edit3 className="w-4 h-4" />}>
              Edit Profile
            </Button>
          ) : undefined
        }
      />

      {/* Incomplete profile alert banner */}
      {!isProfileComplete && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 font-display">Required Profile Information Missing</h3>
            <p className="text-xs text-amber-800 dark:text-amber-400 mt-1 leading-relaxed">
              To participate in course evaluations and peer reviews, your <strong>Institution</strong> and <strong>Department</strong> must be completed.
              Access to reviews and assignments is gated until these required fields are provided.
            </p>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-2.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 dark:bg-amber-700 dark:hover:bg-amber-600 text-white rounded-lg text-xs font-semibold font-display shadow-xs transition"
              >
                Complete Profile Now
              </button>
            )}
          </div>
        </div>
      )}

      {!isEditing ? (
        <ProfileView user={user} onEditAvatar={() => setIsEditing(true)} />
      ) : (
        <ProfileEditForm
          user={user}
          saving={saving}
          onCancel={() => setIsEditing(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default ProfilePage;
