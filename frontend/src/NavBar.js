import { Link } from "react-router"
import SearchBar from "./SearchBar"

export function NavBar() {
  return (
    <nav className="navbar">
      <div className="container">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/Login" className="btn btn-primary">Login</Link>
          <Link to="/CreateAccount" className="btn btn-primary">Create Account</Link>
          <Link to="/CreateChannel" className="btn btn-primary">New Question</Link>
          <Link to="/Accounts" className="btn btn-primary">All Users</Link>
          <SearchBar />
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
