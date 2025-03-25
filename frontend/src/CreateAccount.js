import {useState,useEffect} from "react"

export function CreateAccount() {


	useEffect(() => {
	//	getChannelData()
	},[]);

	//the username button
	const [username,changeUserName] = useState("");

	//the password button
	const [password,changePassword] = useState("");


	


	let url = process.env.URL || "http://localhost:3002"
	const URL = url + "/createAccount"

	

	function handleUserNameUpdate(event) {
		changeUserName(u => u = event.target.value);
	}

	function handlePasswordUpdate(event) {
		changePassword(p => p = event.target.value);
	}

	function createAccount() {

		let uname = username;
		let pass = password;
		fetch(url + "/account", {
			method: "POST",
			headers: {"content-type":"application/json"},
			body:JSON.stringify( {
				username:uname,
				password:pass, 
				photo:0,
				photo_id:1,//leave as undefined for now
				isAdmin:-1,
			},
			)}).then(response => {
			if (!response.ok) {	
				throw new Error(`response status: ${response.status}`)
			}
			else return response.json();

		}).then(d => {
			window.userStatus = {
				isLoggedIn:true,
				username:uname,
				isAdmin:d.isAdmin == 1,
			}

			changeUserName(u => u = "");
			changePassword(p => p = "");

		}).catch(err => console.log(err));

	}






	return (
		<>
		<h4> Enter in a username and password </h4>
		<input type = "text" onChange = {handleUserNameUpdate} value = {username}
		placeholder = "enter in a username"/>
		<input type = "text" onChange = {handlePasswordUpdate} value = {password}
		placeholder = "enter in some password"/>
		<button onClick = {createAccount}> create </button>
		</>

	)


}


export default CreateAccount;
