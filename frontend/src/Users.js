import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
  
// Component to list profiles based on a search query
export function Users() {
  const display = window.userStatus.isLoggedIn;
  const [profiles, setProfiles] = useState([]);
  const { query } = useParams(); // e.g. /profiles/search/:query
  let url = process.env.URL || "http://localhost:3002";
  const URL = url + "/profile/search"; // use profile search endpoint

  useEffect(() => {
    getProfiles();
  }, [query]); // re-run when query changes

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
      // Expecting data in the form: { profile: [...] }
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
            <Link to={`/profile/${profile.id}`}>
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

// Component to view a single profile's details
export function Profile() {
  const { id } = useParams(); // expects route: /profile/:id
  const [profile, setProfile] = useState(null);
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
        // Expecting data in the form: { profile: { ... } }
        setProfile(data.profile);
      } catch (err) {
        console.log(err);
      }
    }
    fetchProfile();
  }, [id, url]);

  if (!profile) {
    return <p>Loading profile...</p>;
  }

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
      {/* You can add an update form here that sends a PUT request to /profile/:id */}
    </div>
  );
}

