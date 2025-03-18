import {useState} from "react"
import {useEffect} from "react"
import Response from "./Response.js"



/*needs its id in the props section*/

function Post(props) {

	const [responses,changeResponses] = useState([]);
	
	//use useEffect to trigger some code when a Post component
	//is mounted on the dom
	useEffect( () => {
	getResponses();
	},[]);

	let id = props.id;
	let url = process.env.URL || "http://localhost:3001"
	const URL = url + "/responses/"+ props.id

	//the response button
	const [data,changeData] = useState("");

	//console.log("my id is :"+id);

	function handleDataUpdate(event) {
		changeData(d => d = event.target.value);
	}


	function submitResponse() {
	
		let theData = data;
		fetch(url + "/postresponse", {
			method: "POST",
			headers: {"Content-Type":"application/json"},
			body:JSON.stringify( {
				postId:id,
				data:data, //possible variable shadow bug here
			}
		)}).then(response => {
			if (!response.ok) {	
				throw new Error(`Response status: ${response.status}`)
			}
			else return response.json();

		}).then(data => 
			changeResponses( prev => 
			prev = [...prev,{data:theData,_id:data.id}] //adds the new document to the array 
			) 
		).catch(err => console.log(err));



	}

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
			data = {response.data} 
			timestamp =  {response.timestamp}
			key = {response._id}/>)}
		</ul>

		<p>enter in a response</p>
		<input type = "text" onChange = {handleDataUpdate}/>
		<button onClick = {submitResponse}> submit </button>

		</div>



	)









}

export default Post;
