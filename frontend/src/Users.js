import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { Photo } from "./Photo";
import './App.css';

export function Users() {
  const display = window.userStatus.isLoggedIn;
  const [profiles, setProfiles] = useState([]);
  const { query } = useParams();
  let url = process.env.URL || "http://localhost:3002";
  const URL = url + "/profile/search";

  useEffect(() => {
    getProfiles();
  }, [query]);

  async function getProfiles() {
    try {
      const response = await fetch(URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: query || "" }),
      });
      if (!response.ok) {
        throw new Error("Response status " + response.status);
      }
      const data = await response.json();
      setProfiles(data.profiles);
    } catch (err) {
      console.log(err);
    }
  }
  return display ? (
    <div className="card">
      <div className="p-3">
        <h2 className="text-primary mb-4">Profiles</h2>
        <div className="grid gap-3">
          {profiles.map((profile) => (
            <div key={profile.id} className="card mb-2">
              <div className="p-3">
                <h4 className="text-primary mb-2">
                  {profile.username || "Untitled Profile"}
                </h4>
                <Link 
                  to={`/user/${profile.id}`}
                  className="btn btn-primary mt-2"
                >
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <div className="card p-3">
      <p className="text-secondary">Please log in to view profiles</p>
    </div>
  );
}

export function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    job_title: "",
    interests: "",
    education: "",
  });
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const loggedInUser = window.userStatus.username;
  let url = process.env.URL || "http://localhost:3002";

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(`${url}/profile/${id}`, {
          method: "GET",
          headers: { "content-type": "application/json" },
        });
        if (!response.ok) {
          throw new Error("Response status " + response.status);
        }
        const data = await response.json();
        setProfile(data.profile);
        setFormData({
          job_title: data.profile.job_title || "",
          interests: data.profile.interests || "",
          education: data.profile.education || "",
        });
      } catch (err) {
        console.log(err);
      }
    }
    fetchProfile();
  }, [id, url]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    setSelectedPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append("job_title", formData.job_title);
    formDataToSend.append("interests", formData.interests);
    formDataToSend.append("education", formData.education);
    if (selectedPhoto) {
      formDataToSend.append("photo", selectedPhoto);
    }

    try {
      const response = await fetch(`${url}/profile/${id}`, {
        method: "PUT",
        body: formDataToSend,
      });

      if (response.ok) {
        alert("Profile updated successfully!");
      } else {
        throw new Error("Profile update failed");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  if (!profile) return <div className="card p-3">Loading profile...</div>;

  profile.username = profile.username.replace(/[\n\r\t]/gm, "").trim();
  const isOwner = profile.username === loggedInUser;

  return (
    <div className="card">
      <div className="p-3">
        <h2 className="text-primary mb-3">Profile Details</h2>
        
        <div className="photo-container mb-4">
          {profile.photo_id ? (
            <Photo photo_id={profile.photo_id} />
          ) : (
            <p className="text-secondary">No profile photo</p>
          )}
        </div>

        <div className="mb-4">
          <p className="text-primary">
            <strong>Username:</strong> {profile.username}
          </p>
          <p className="text-primary">
            <strong>Job Title:</strong> {profile.job_title || "Not specified"}
          </p>
          <p className="text-primary">
            <strong>Interests:</strong> {profile.interests || "Not specified"}
          </p>
          <p className="text-primary">
            <strong>Education:</strong> {profile.education || "Not specified"}
          </p>
        </div>

        {isOwner && (
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="form-group">
              <label className="text-primary">Job Title</label>
              <input
                type="text"
                className="form-control"
                name="job_title"
                value={formData.job_title}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="text-primary">Interests</label>
              <input
                type="text"
                className="form-control"
                name="interests"
                value={formData.interests}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="text-primary">Education</label>
              <input
                type="text"
                className="form-control"
                name="education"
                value={formData.education}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="text-primary">Profile Photo</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </div>

            <button type="submit" className="btn btn-primary mt-3">
              Update Profile
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
