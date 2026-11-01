
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  getMyProfile,
  updateMyProfile,
  uploadProfilePicture,
  removeProfilePicture,
  changeMyPassword
} from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingPicture, setRemovingPicture] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Automatically dismiss password notifications after 4 seconds.
    useEffect(() => {
    if (!passwordError && !passwordSuccess) return;

    const timer = setTimeout(() => {
        setPasswordError("");
        setPasswordSuccess("");
    }, 4000);

    return () => clearTimeout(timer);
    }, [passwordError, passwordSuccess]);

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("campusfind_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const data = await getMyProfile();

        setProfile(data);
        setFullName(data.full_name || "");
      } catch (err) {
        setError(err.message || "Could not load your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  async function handleSaveProfile(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (fullName.trim().length < 2) {
      setError("Your name must contain at least 2 characters.");
      return;
    }

    try {
      setSaving(true);

      const updatedProfile = await updateMyProfile({
        full_name: fullName.trim(),
      });

      setProfile(updatedProfile);
      setFullName(updatedProfile.full_name || "");
      setIsEditing(false);
      setSuccess("Your profile was updated successfully.");
    } catch (err) {
      setError(err.message || "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePictureUpload(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPEG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile picture must be smaller than 5 MB.");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);

      const updatedProfile = await uploadProfilePicture(file);

      setProfile(updatedProfile);
      setSuccess("Profile picture updated successfully.");
    } catch (err) {
      setError(err.message || "Could not upload profile picture.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleRemovePicture() {
    const confirmed = window.confirm(
      "Are you sure you want to remove your profile picture?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      setRemovingPicture(true);

      const updatedProfile = await removeProfilePicture();

      setProfile(updatedProfile);
      setSuccess("Profile picture removed successfully.");
    } catch (err) {
      setError(err.message || "Could not remove profile picture.");
    } finally {
      setRemovingPicture(false);
    }
  }

  function handleCancelEdit() {
    setFullName(profile?.full_name || "");
    setIsEditing(false);
    setError("");
  }

  function formatDate(dateString) {
    if (!dateString) return "Not available";

    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-gray-500">Loading your profile...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <p className="text-red-500 mb-4">
          {error || "Could not load your profile."}
        </p>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to homepage
        </Link>
      </main>
    );
  }

async function handleChangePassword(e) {
  e.preventDefault();

  setPasswordError("");
  setPasswordSuccess("");

  if (newPassword.length < 8) {
    setPasswordError(
      "Your new password must contain at least 8 characters."
    );
    return;
  }

  if (newPassword !== confirmPassword) {
    setPasswordError("New passwords do not match.");
    return;
  }

  if (currentPassword === newPassword) {
    setPasswordError(
      "Your new password must be different from your current password."
    );
    return;
  }

  try {
    setChangingPassword(true);

    const result = await changeMyPassword({
      current_password: currentPassword,
      new_password: newPassword,
    });

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setPasswordSuccess(
      result.message || "Password changed successfully."
    );
  } catch (err) {
    setPasswordError(
      err.message || "Could not change your password."
    );
  } finally {
    setChangingPassword(false);
  }
}

  const initials = (profile.full_name || profile.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <div className="max-w-3xl mx-auto">

        {/* Page heading */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Home
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
            My Profile
          </h1>

          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage your personal information and account details.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
            {success}
          </div>
        )}

        {/* Profile card */}
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">

          {/* Profile picture section */}
          <div className="p-6 sm:p-8 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Profile Picture
            </h2>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6">

              <div className="w-28 h-28 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0 border-4 border-gray-100 dark:border-gray-800">
                {profile.profile_picture_url ? (
                  <img
                    src={profile.profile_picture_url}
                    alt="Profile picture"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-blue-700 dark:text-blue-300">
                    {initials}
                  </span>
                )}
              </div>

              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {profile.full_name || "Your profile"}
                </p>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  JPEG, PNG, or WebP. Maximum size: 5 MB.
                </p>

                <div className="flex flex-wrap gap-3 mt-4">

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || removingPicture}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploading
                      ? "Uploading..."
                      : profile.profile_picture_url
                      ? "Change Picture"
                      : "Upload Picture"}
                  </button>

                  {profile.profile_picture_url && (
                    <button
                      type="button"
                      onClick={handleRemovePicture}
                      disabled={uploading || removingPicture}
                      className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950 disabled:opacity-50"
                    >
                      {removingPicture ? "Removing..." : "Remove"}
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePictureUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Personal information */}
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Personal Information
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Your basic account information.
                </p>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setFullName(profile.full_name || "");
                    setIsEditing(true);
                    setError("");
                    setSuccess("");
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-5">

                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Full Name
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={100}
                    minLength={2}
                    required
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 px-4 py-3 text-gray-500 cursor-not-allowed"
                  />

                  <p className="text-xs text-gray-500 mt-1">
                    Your email address cannot currently be changed.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Full Name
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {profile.full_name || "Not added yet"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Email Address
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white break-all">
                    {profile.email}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Member Since
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(profile.created_at)}
                  </p>
                </div>

              </div>
            )}
          </div>
        </section>

        {/* Account information */}
        <section className="mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Account Information
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Your CampusFind account is active. You can manage your personal details above.
          </p>

          <div className="mt-5">
            <Link
              href="/my-reports"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              View My Reports →
            </Link>
          </div>
        </section>
        
            
{/* Change Password Section */}
<section className="mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8">

  <div className="mb-6">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
      Change Password
    </h2>

    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
      Update your password to keep your account secure.
    </p>
  </div>

  <form onSubmit={handleChangePassword} className="space-y-5">
    {/* Password notifications */}
        {passwordError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {passwordError}
        </div>
        )}

        {passwordSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
            {passwordSuccess}
        </div>
        )}

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Current Password
      </label>

      <input
        type={showPasswords ? "text" : "password"}
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
        autoComplete="current-password"
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter current password"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        New Password
      </label>

      <input
        type={showPasswords ? "text" : "password"}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        minLength={8}
        maxLength={128}
        autoComplete="new-password"
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter new password"
      />

      <p className="text-xs text-gray-500 mt-1">
        Minimum 8 characters.
      </p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Confirm New Password
      </label>

      <input
        type={showPasswords ? "text" : "password"}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        autoComplete="new-password"
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-4 py-3 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Confirm new password"
      />
    </div>

    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
      <input
        type="checkbox"
        checked={showPasswords}
        onChange={(e) => setShowPasswords(e.target.checked)}
        className="accent-blue-600"
      />
      Show passwords
    </label>

    <button
      type="submit"
      disabled={
        changingPassword ||
        !currentPassword ||
        !newPassword ||
        !confirmPassword
      }
      className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
    >
      {changingPassword ? "Updating..." : "Change Password"}
    </button>

  </form>
</section>


      </div>
    </main>
  );
}
