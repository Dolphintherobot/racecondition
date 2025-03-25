import {Link,Outlet} from "react-router"
import ChannelList from "./ChannelList.js"
import Login from "./Login.js"
import CreateAccount from "./CreateAccount.js"

export function NavBar() {

	return (

		<>
		<Link to = "/Login"> <button> login </button> </Link>
		<Link to = "/CreateAccount"> <button> Create Account </button> </Link>
		<Link to = "/Search"> <button> Search </button> </Link>
		</>
	)



}

export default NavBar;
