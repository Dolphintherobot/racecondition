import { useState } from "react"
import './App.css';

export function Login() {
  const [username, changeUserName] = useState("");
  const [password, changePassword] = useState("");
  const URL = `${process.env.URL || "http://localhost:3002"}/account/verify`;

  return (
    <div className="container">
      <div className="card">
        <h2>Login</h2>
        <div className="form-group">
          <input
            type="text"
            className="form-control"
            onChange={(e) => changeUserName(e.target.value)}
            value={username}
            placeholder="Username"
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            className="form-control"
            onChange={(e) => changePassword(e.target.value)}
            value={password}
            placeholder="Password"
          />
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => {
            fetch(URL, {
              method: "POST",
              headers: {"content-type":"application/json"},
              body: JSON.stringify({ username, password })
            })
            .then(response => {
              if (response.ok) {
                window.userStatus = {
                  isLoggedIn: true,
                  username: username,
                  isAdmin: response.json().then(d => d.isAdmin == 1)
                };
                window.alert("Successful login");
              }
            })
            .catch(err => window.alert(err));
          }}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default Login;
