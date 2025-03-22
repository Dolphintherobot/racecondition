import {useState,useEffect} from "react"

function Response(props) {

	const [responses,changeResponses] = useState([]);

	useEffect(() => {

		getResponses();
	},[])


	let id = props.id
	let url = process.env.URL || "http://localhost:3002"
	const URL = url + "/nestedReply/"+ props.id

	let description = props.description;

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
				reply_id:id,
				topic:props.topic,
				description:data,//possible variable shadow bug here
				post_id: undefined,
			}
		)}).then(response => {
			if (!response.ok) {	
				throw new Error(`Response status: ${response.status}`)
			}
			else return response.json();

		}).then(d => 
			changeResponses( prev => 
			prev = [...prev,{topic:props.topic,description:data,id:d.replyId}] //adds the new document to the array 
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
			
			if (data.reply.length == 0)  {return;}

			changeResponses( prev => 
			prev = prev.concat(data.reply) ) 
		}).catch(err => console.log(err));

	}







	return (
		<>
		<p> {props.description}  </p>
		<ul> 
		{responses.map( response => 
			<Response 
			id = {response.id}
			topic = {props.topic}
			description = {response.description} 
			timestamp =  {response.timestamp}
			key = {response.id}/>)}
		</ul>
		<p>enter in a response</p>
		<input type = "text" onChange = {handleDataUpdate}/>
		<button onClick = {submitResponse}> submit </button>
		</>
	);

}



export default Response;
