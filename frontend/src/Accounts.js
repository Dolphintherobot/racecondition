import { useState, useEffect } from "react"
import DeleteButton from "./DeleteButton.js"
import './App.css';

function Account() {
  const [accounts, changeAccounts] = useState([]);
  const URL = `${process.env.URL || "http://localhost:3002"}/account`;

  useEffect(() => {
    fetch(URL)
      .then(response => response.json())
      .then(data => changeAccounts(data));
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h2>User Accounts</h2>
        <ul className="list-unstyled">
          {accounts.map(a => (
            <li key={a.id} className="list-item">
              <div className="d-flex justify-content-between align-items-center">
                <span>{a.username}</span>
                <DeleteButton id={a.id} type="account" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Account;
