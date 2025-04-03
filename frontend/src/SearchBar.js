import { useState } from "react"
import { Link } from "react-router"
import './App.css';

function SearchBar() {
  const [text, changeText] = useState("");
  const [path, changePath] = useState("");

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <input
        type="text"
        className="form-control"
        onChange={(e) => {
          changeText(e.target.value);
          changePath(`/Search/${e.target.value}`);
        }}
        placeholder="Search..."
      />
      <Link to={path} className="btn btn-primary">
        Search
      </Link>
    </div>
  );
}

export default SearchBar;
