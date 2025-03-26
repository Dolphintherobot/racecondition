import {useState} from "react"

export function Login() {

	//use window.alert(message) to alert the user
	//the username button
	const [username,changeUserName] = useState("");

	//the password button
	const [password,changePassword] = useState("");


	


	let url = process.env.URL || "http://localhost:3002"
	const URL = url + "/account/verify"

	

	function handleUserNameUpdate(event) {
		changeUserName(u => u = event.target.value);
	}

	function handlePasswordUpdate(event) {
		changePassword(p => p = event.target.value);
	}


	function verifyAccount() {

		let uname = username;
		let pass = password;
		fetch(URL, {
			method: "POST",
			headers: {"content-type":"application/json"},
			body:JSON.stringify( {
				username:uname,
				password:pass, 
			},
			)}).then(response => {
			if (!response.ok) {	
				throw new Error(`Account not verified: ${response.status}`)
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
			window.alert("succesful login");

		}).catch( err => {
			console.log(err)
			window.alert(err);
		});

	}



	return (
		<>
		<h2> login </h2>
		<h4> Enter in a username and password </h4>
		<input type = "text" onChange = {handleUserNameUpdate} value = {username}
		placeholder = "enter in a username"/>
		<input type = "text" onChange = {handlePasswordUpdate} value = {password}
		placeholder = "enter in some password"/>
		<button onClick = {verifyAccount}> Login </button>
		</>

	)

}

export default Login;
