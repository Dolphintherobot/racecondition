import {useState} from "react"
import Search from "./Search.js"
import {Link} from "react-router"

function SearchBar() {

	const [text,changeText] = useState(" ");

	const [path,changePath] = useState(" ");

	function handleTextUpdate(event) {
		changeText(t => t = event.target.value);
		changePath(p => p = `/Search/${event.target.value}`)
	}


	return (
		<>
		<p>search for something</p>
		<input type = "text" onChange = {handleTextUpdate}/>
		<Link to = {path} ><button> Search </button> </Link>
		</>
	)




}


export default SearchBar;
