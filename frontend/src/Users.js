import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { Photo } from "./Photo"

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
              {profile.username || "Untitled Profile"}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  ) : (
    <p>Log in before being able to view profiles</p>
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
  const url = process.env.URL || "http://localhost:3002";

  useEffect(() => {
    async function fetchProfile() {
      const response = await fetch(`${url}/profile/${id}`);
      const data = await response.json();
      setProfile(data.profile);
      setFormData({
        job_title: data.profile.job_title || "",
        interests: data.profile.interests || "",
        education: data.profile.education || "",
      });
    }
    fetchProfile();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append("job_title", formData.job_title);
    formDataToSend.append("interests", formData.interests);
    formDataToSend.append("education", formData.education);
    if (selectedPhoto) formDataToSend.append("photo", selectedPhoto);

    await fetch(`${url}/profile/${id}`, {
      method: "PUT",
      body: formDataToSend,
    });
  };

  if (!profile) return <p>Loading...</p>;

  return (
    <div className="container">
      <div className="card">
        <h2>{profile.username}'s Profile</h2>
        
        <div className="photo-container">
          {profile.photo_id ? (
            <Photo photo_id={profile.photo_id} />
          ) : (
            <p>No profile photo</p>
          )}
        </div>

        <div className="form-group">
          <label>Job Title</label>
          <p>{profile.job_title || "Not specified"}</p>
        </div>

        <div className="form-group">
          <label>Interests</label>
          <p>{profile.interests || "Not specified"}</p>
        </div>

        <div className="form-group">
          <label>Education</label>
          <p>{profile.education || "Not specified"}</p>
        </div>

        {profile.username === loggedInUser && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                name="job_title"
                value={formData.job_title}
                onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                placeholder="Job Title"
              />
            </div>
            
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                name="interests"
                value={formData.interests}
                onChange={(e) => setFormData({...formData, interests: e.target.value})}
                placeholder="Interests"
              />
            </div>
            
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                name="education"
                value={formData.education}
                onChange={(e) => setFormData({...formData, education: e.target.value})}
                placeholder="Education"
              />
            </div>
            
            <div className="form-group">
              <input
                type="file"
                className="form-control"
                onChange={(e) => setSelectedPhoto(e.target.files[0])}
              />
            </div>
            
            <button className="btn btn-primary" type="submit">
              Update Profile
            </button>
          </form>
        )}
      </div>
    </div>
  );
}


