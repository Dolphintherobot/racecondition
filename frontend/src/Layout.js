import NavBar from "./NavBar"
import { Outlet } from "react-router"
import './App.css';

function Layout() {
  return (
    <div className="container">
      <NavBar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
