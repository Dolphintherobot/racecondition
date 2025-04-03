import {useState,useEffect,useContext} from "react"
import Post from "./Post.js"
import DeleteButton from "./DeleteButton.js"
import {useNavigate} from "react-router"

function CreateChannel() {

	const [data,changeData] = useState("");
	const [topic,changeTopic] = useState("");

	const navigate = useNavigate();

	let username = window.userStatus.username;

	let url = process.env.URL || "http://localhost:3002"
	const URL = url + "/channel"

	let isLoggedIn = window.userStatus.isLoggedIn;
	

	function handleDataUpdate(event) {
		changeData(d => d = event.target.value);
	}

	function handleTopicUpdate(event) {
		changeTopic(t => t = event.target.value);
	}


	function submitChannel() {

		let thetopic = topic;
		let thedata = data;
		fetch(URL, {
			method: "POST",
			headers: {"content-type":"application/json"},
			body:JSON.stringify( {
				title:thetopic,
				description:thedata,
				username:username,
			},
			)}).then(response => {
			if (!response.ok) {	
				throw new Error(`response status: ${response.status}`)
			}
			else return response.json();

		}).then(d => {	
			let path = `/Channel/${d.channelId}/${d.title}/${d.description}`
			window.alert("Channel succesfully created");
			navigate(path);
			changeTopic(t => t = "");
			changeData(d => d = "");
		}).catch(err => {
			window.alert("Error creating channel error: " +err);
			console.log(err)}
		);

	}








	return ( isLoggedIn ?

		<div>

		<h4> Enter in a title and a description for the new Channel  </h4>

		<input type = "text" onChange = {handleTopicUpdate} value = {topic}
		placeholder = "enter in a title"/>
		<input type = "text" onChange = {handleDataUpdate} value = {data}
		placeholder = "enter in some description"/>
		<button onClick = {submitChannel}> submit </button>

		<DeleteButton/>
	</div>
		:
		<p> Log in first before creating a channel </p>

	)

}

export default CreateChannel;
