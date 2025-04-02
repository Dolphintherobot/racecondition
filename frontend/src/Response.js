import {useState,useEffect} from "react"
import ResponseAuthor from "./ResponseAuthor"
import DeleteButton from "./DeleteButton"
import { Photo,PhotoForm } from "./Photo"
import Button from "./Button.js"
import {Rank} from "./Rank"

function Response(props) {

	const [responses,changeResponses] = useState([]);
	const [photo,changePhoto] = useState(null); 

	useEffect(() => {

		getResponses();
	},[])


	let id = props.id
	let url = process.env.URL || "http://localhost:3002"
	const URL = url + "/nestedReply/"+ props.id

	let description = props.description;

	const author = props.author
	const username  = window.userStatus.username
	//the response button
	const [data,changeData] = useState("");

	//console.log("my id is :"+id);

	function handleDataUpdate(event) {
		changeData(d => d = event.target.value);
	}


	function submitResponse() {
		let formdata = new FormData()
		formdata.append("reply_id",id);
		formdata.append("description",data);
		formdata.append("topic",props.topic);
		formdata.append("author",username);
		formdata.append("postId",-1);
		if (photo) {
			formdata.append("photo",photo);

		}




		let theData = data;
		fetch(url + "/reply", {
			method: "POST",
			body:formdata,
		}).then(response => {
			if (!response.ok) {	
				throw new Error(`Response status: ${response.status}`)
			}
			else return response.json();

		}).then(d => 
			changeResponses( prev => 
			prev = [...prev,{topic:props.topic,description:data,id:d.replyId,
			author:username,photo}] //adds the new document to the array 
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



		//if want nested reply photos
		//<PhotoForm photo = {photo} changePhoto = {changePhoto}/>




	return ( id != null ?
		<>
		<p> {props.description}  </p>
		<Rank author = {author}/>
		<Photo photo = {props.photo}/>
		<ul> 
		{responses.map( response => 
			<Response 
			id = {response.id}
			topic = {props.topic}
			description = {response.description} 
			timestamp =  {response.timestamp}
			photo = {response.photo}
			key = {response.id}
			/>)}
		</ul>
		<p>enter in a  reply to the response</p>
		<Button replyId = {id} upvotes = {0} />
		
		<input type = "text" onChange = {handleDataUpdate}/>
		<button onClick = {submitResponse}> submit </button>	
		<ResponseAuthor author = {props.author}/>
		<DeleteButton id = {id} type = {"reply"}/>
		</> :
		<></>
	);

}



export default Response;
