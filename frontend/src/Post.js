import {useState} from "react"
import {useEffect} from "react"
import Response from "./Response.js"




/*Properities of a Post should be 
 {
 id: //id of the post
 topic: //topic of the post
 description: textual description
 replies: //an array of replies in form of {id:,topic:,description}
 button: {id:,upvotes}
 }
 *
 * */

function Post(props) {



	const [responses,changeResponses] = useState(props.responses);
	
	//use useEffect to trigger some code when a Post component
	//is mounted on the dom
	useEffect( () => {
	//getResponses();
	},[]);

	let id = props.id;
	let url = process.env.URL || "http://localhost:3002"
	const URL = url + "/reply/"+ props.id

	//console.log(props.description);
	//console.log(id);
	let username = window.userStatus.username;

	const author = props.author;

	//the response button
	const [data,changeData] = useState("");

	//console.log("my id is :"+id);

	function handleDataUpdate(event) {
		changeData(d => d = event.target.value);
	}


	function submitResponse() {
	
		let theData = data;
		fetch(url + "/reply", {
			method: "POST",
			headers: {"Content-Type":"application/json"},
			body:JSON.stringify( {
				post_id:id,
				description:data,//possible variable shadow bug here
				topic:props.topic,
				reply_id: undefined,
				username:username,
			}
		)}).then(response => {
			if (!response.ok) {	
				throw new Error(`Response status: ${response.status}`)
			}
			else return response.json();

		}).then(d =>{ 
			

			console.log(data);
			changeResponses( prev => 
			prev = [...prev,{topic:props.topic,description:data,id:d.replyId,author:username,}] //adds the new document to the array 
		)} 
		).catch(err => console.log(err));



	}



	//NOTE IF WANT TO USE FUNCTION,
	//HAS TO BE UPDATED TO WORK WITH CURRENT API 
	function getResponses() {
	
		fetch(URL).then(response => {
		
			if (!response.ok) {	
				throw new Error(`Response status: ${response.status}`)
			}
			else return response.json();

		}).then(data => { 
			console.log(data);
			changeResponses( prev => 
			prev = prev.concat(data.docs) ) 
		}).catch(err => console.log(err));

	}



	return (
	
		<div>

		<h2> {props.topic} </h2>
		<p> {props.description} </p>
		<p> posted by {author} </p>
		<ul> 
		{responses.map( response =>
			<Response 
			id = {response.id}
			description = {response.description} 
			timestamp =  {response.timestamp}
			topic = {response.topic}
			author = {response.author}
			key = {response.id}/>)}
		</ul>

		<p>enter in a response to the post</p>
		<input type = "text" onChange = {handleDataUpdate}/>
		<button onClick = {submitResponse}> submit </button>

		</div>



	)









}

export default Post;
