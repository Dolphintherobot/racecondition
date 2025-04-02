import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";

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
      setProfiles(data.profile);
    } catch (err) {
      console.log(err);
    }
  }

  return display ? (
    <div>
      <h2>Profiles</h2>
      <ul>
        {profiles.map((profile) => (
          <li key={profile.id}>
            <Link to={`/user/${profile.id}`}>
              {profile.job_title || "Untitled Profile"}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  ) : (
    <p>Log in before being able to view profiles</p>
  );
}

// Profile component with an update form
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
       // window.location.reload(); // Refresh the profile
      } else {
        throw new Error("Profile update failed");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  if (!profile) {
    return <p>Loading profile...</p>;
  }

  profile.username = profile.username.replace(/[\n\r\t]/gm, "").trim()
  const isOwner = profile.username === loggedInUser;





  return (
    <div>
      <h2>Profile Details</h2>
      <p>
        <strong>Job Title:</strong> {profile.job_title}
      </p>
      <p>
        <strong>Interests:</strong> {profile.interests}
      </p>
      <p>
        <strong>Education:</strong> {profile.education}
      </p>
      {profile.photo_id ? (
        <img
          src={`${url}/photo/${profile.photo_id}`}
          alt="Profile"
          style={{ maxWidth: "200px" }}
        />
      ) : (
        <p>No profile photo</p>
      )}

      {isOwner && (
        <div>
          <h3>Edit Profile</h3>
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <label>
              Job Title:
              <input
                type="text"
                name="job_title"
                value={formData.job_title}
                onChange={handleChange}
              />
            </label>
            <br />
            <label>
              Interests:
              <input
                type="text"
                name="interests"
                value={formData.interests}
                onChange={handleChange}
              />
            </label>
            <br />
            <label>
              Education:
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
              />
            </label>
            <br />
            <label>
              Profile Photo:
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
            </label>
            <br />
            <button type="submit">Update Profile</button>
          </form>
        </div>
      )}
    </div>
  );
}

