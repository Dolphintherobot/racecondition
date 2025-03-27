import logo from './logo.svg';
import './App.css';
import Channel from "./Channel.js"
import {useContext,useState,createContext} from "react"
import {HashRouter as Router,Routes,Route} from "react-router"
import Landing from "./Landing.js"
import ChannelList from "./ChannelList.js"
import Login from "./Login.js"
import CreateAccount from "./CreateAccount.js"
import Layout from  "./Layout"
import Search from "./Search"
import CreateChannel from "./CreateChannel"

//we need a global variable to track the users account information
//useContext will not work here as it seems to ban all props which I still
//need in my component 
window.userStatus = {
	isLoggedIn:false,
	isAdmin:false,
	username:"",
};




function App() {
  
	let x = 3
	let defaultState = {
		username:"",
		isAdmin:false,
		isLoggedIn:false,
	}

	//<UserContext.Provider value = {userInfo}>

	//<UserContext.Provider/>

	const [userInfo,changeInfo] = useState(defaultState)
	return (
		<div>
	 
		<Router>

			<Routes>
			<Route path = "/" element  = {<Layout/>}>
		
			<Route path = "/test" element = {<Channel id = {x} title = "Dabe" isLoggedIn = {false}/>}/>
			<Route path = "/Login" element = {<Login/>}/>
			<Route path = "/CreateAccount" element = {<CreateAccount/>}/>
			<Route exact path = "/Search/:query" element = {<Search/>}/>
			<Route exact path = "/Channel/:id/:title/:description" element = {<Channel/>}/>
			<Route path = "/Landing" element = {<Landing/>}/>
			<Route path = "/CreateChannel" element = {<CreateChannel/>}/>
		</Route>
		</Routes>
		</Router>
		</div>
	);
}

export default App;
