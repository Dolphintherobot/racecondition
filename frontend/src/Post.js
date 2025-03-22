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
	const URL = url + "/responses/"+ props.id

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
				reply_id: undefined,
			}
		)}).then(response => {
			if (!response.ok) {	
				throw new Error(`Response status: ${response.status}`)
			}
			else return response.json();

		}).then(data => 
			changeResponses( prev => 
			prev = [...prev,{description:data,id:data.replyId}] //adds the new document to the array 
			) 
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
		<p> {props.data} </p>

		<ul> 
		{responses.map( response => 
			<Response 
			id = {response.id}
			description = {response.description} 
			timestamp =  {response.timestamp}
			key = {response.id}/>)}
		</ul>

		<p>enter in a response</p>
		<input type = "text" onChange = {handleDataUpdate}/>
		<button onClick = {submitResponse}> submit </button>

		</div>



	)









}

export default Post;
