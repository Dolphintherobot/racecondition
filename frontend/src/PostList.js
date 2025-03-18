import Post from "./Post"
import {useState} from "react"
import {useEffect} from "react"

function PostList(props) {

	const [posts,changePosts] = useState([]);
	//is mounted on the dom
	useEffect( () => {
	getPosts();
	},[]);

	//the data button
	const [data,changeData] = useState("");

	//the topic button
	const [topic,changeTopic] = useState("");


	const id = props.id;
	let url = process.env.URL || "http://localhost:3001"
	const URL = url + "/alldata"


	

	function handleDataUpdate(event) {
		changeData(d => d = event.target.value);
	}

	function handleTopicUpdate(event) {
		changeTopic(t => t = event.target.value);
	}



	function submitPost() {

		let theTopic = topic;
		let theData = data;
		fetch(url + "/postmessage", {
			method: "POST",
			headers: {"Content-Type":"application/json"},
			body:JSON.stringify( {
				topic:theTopic,
				data:theData, //possible variable shadow bug here
			},
			)}).then(response => {
			if (!response.ok) {	
				throw new Error(`Response status: ${response.status}`)
			}
			else return response.json();

		}).then(data => {
			var x = {
				topic:theTopic,
				data:theData,
				_id:data.id,
			}
			changePosts( prev => 
			prev = [...prev,x] //adds the new document to the array 	
		)

			changeTopic(t => t = "");
			changeData(d => d = "");
		}).catch(err => console.log(err));



	}

	function getPosts() {
	
		fetch(URL).then(response => {
		
			if (!response.ok) {	
				throw new Error(`Response status: ${response.status}`)
			}
			else return response.json();

		}).then(data => {
			//console.log(data);
			console.log(posts);
			changePosts( prev => 
			prev = prev.concat(data.posts) )
		}).catch(err => console.log(err));

	}



	return (
	
		<div>

		<h2> Enter in a post </h2>
		<input type = "text" onChange = {handleTopicUpdate} value = {topic}
		placeholder = "enter in a topic"/>
		<input type = "text" onChange = {handleDataUpdate} value = {data}
		placeholder = "enter in some data"/>
		<button onClick = {submitPost}> submit </button>

		<ul> 
		{posts.map( post => 
			<Post 
			data = {post.data} 
			topic =  {post.topic}
			id = {post._id}
			key = {post._id}
			/>)}
		</ul>
		</div>
	)

}


export default PostList;
