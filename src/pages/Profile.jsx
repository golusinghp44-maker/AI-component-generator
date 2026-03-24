import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { HiX } from "react-icons/hi";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

const Profile = () => {
  const { user, updateUserProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name cannot be empty");
      return;
    }

    updateUserProfile({ name: trimmed });
    setIsEditing(false);
    toast.success("Profile updated");
  };

  return (
    <div className="min-h-screen app-surface app-text-primary">
      <Navbar />
      <div className="px-[100px] py-8">
        <div className="app-panel rounded-xl border app-border p-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold">Profile</h1>
            <div className="flex items-center gap-2">
              <Link
                to="/account-settings"
                className="px-4 py-2 rounded-md border app-border app-hover"
              >
                Account Settings
              </Link>
              <button
                type="button"
                onClick={() => navigate("/")}
                aria-label="Close profile"
                className="w-10 h-10 rounded-md border app-border app-hover flex items-center justify-center"
              >
                <HiX className="text-xl" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold bg-purple-600 text-white">
              {initials}
            </div>
            <div>
              <p className="text-sm app-text-secondary">Signed in as</p>
              <p className="font-semibold">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm app-text-secondary">Full Name</label>
              {isEditing ? (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field mt-2 w-full rounded-md border px-3 py-2"
                />
              ) : (
                <p className="mt-2 text-lg font-medium">{user?.name || "Not set"}</p>
              )}
            </div>

            <div>
              <label className="text-sm app-text-secondary">Email</label>
              <p className="mt-2 text-lg font-medium">{user?.email}</p>
              <p className="text-xs app-text-secondary mt-1">Email is read-only for the current auth model.</p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            {!isEditing ? (
              <button className="sp-gradient-btn px-4 py-2 rounded-md text-white" onClick={() => setIsEditing(true)}>
                Click to Edit
              </button>
            ) : (
              <>
                <button className="sp-gradient-btn px-4 py-2 rounded-md text-white" onClick={handleSave}>
                  Save
                </button>
                <button
                  className="px-4 py-2 rounded-md border app-border app-hover"
                  onClick={() => {
                    setName(user?.name || "");
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
