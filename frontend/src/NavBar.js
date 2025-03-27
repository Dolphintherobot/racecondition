import {Link,Outlet} from "react-router"
import ChannelList from "./ChannelList.js"
import Login from "./Login.js"
import CreateAccount from "./CreateAccount.js"
import SearchBar from "./SearchBar"
export function NavBar() {

	return (

		<>
		<Link to = "/Login"> <button> login </button> </Link>
		<Link to = "/CreateAccount"> <button> Create Account </button> </Link>
		<Link to = "/CreateChannel"> <button> Post a new question </button> </Link>
		<Link to = "/Accounts"> <button> Display all users </button> </Link>
		
		<SearchBar/>
		</>
	)



}

export default NavBar;
