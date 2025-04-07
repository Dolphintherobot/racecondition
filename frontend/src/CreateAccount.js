import { useState } from "react"
import './App.css';

export function CreateAccount() {
  const [username, changeUserName] = useState("");
  const [password, changePassword] = useState("");
  const URL = `${process.env.URL || "http://localhost:3002"}/account`;

  return (
    <div className="container">
      <div className="card">
        <h2>Create Account</h2>
        <div className="form-group">
          <input
            type="text"
            className="form-control"
            onChange={(e) => changeUserName(e.target.value)}
            placeholder="Username"
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            className="form-control"
            onChange={(e) => changePassword(e.target.value)}
            placeholder="Password"
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            fetch(URL, {
              method: "POST",
              headers: {"content-type":"application/json"},
              body: JSON.stringify({
                username,
                password,
                photo_id: 1,
                isAdmin: -1
              })
            })
            .then(response => {
              if (response.ok) {
                  window.alert("Account created successfully");
		      return response.json()
              }
            }).then(d => {
	    
		  window.userStatus = {
                  isLoggedIn: true,
                  username: username,
                  isAdmin: false,
		  id:d.id,
                };

	    });
          }}
        >
          Create Account
        </button>
      </div>
    </div>
  );
}

export default CreateAccount;
