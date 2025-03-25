import useState from "react"
import NavBar from  "./NavBar"
import {Outlet} from "react-router"

function Layout() {

	return (
		<>
		<NavBar/>
		<Outlet/>
		</>
	);
}



export default Layout;
