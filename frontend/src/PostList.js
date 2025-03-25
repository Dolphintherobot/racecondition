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


	

	function handledataupdate(event) {
		changedata(d => d = event.target.value);
	}

	function handletopicupdate(event) {
		changetopic(t => t = event.target.value);
	}



	function submitpost() {

		let thetopic = topic;
		let thedata = data;
		fetch(url + "/post", {
			method: "post",
			headers: {"content-type":"application/json"},
			body:json.stringify( {
				topic:thetopic,
				data:thedata, //possible variable shadow bug here
				channelId:id,
			},
			)}).then(response => {
			if (!response.ok) {	
				throw new error(`response status: ${response.status}`)
			}
			else return response.json();

		}).then(d => {
			var x = {
				topic:thetopic,
				description:thedata,
				id:d.postId,
				responses:[],
				button:0,
			}
			changeposts( prev => { 
			prev = [...prev,x] //adds the new document to the array 	
		)

			changetopic(t => t = "");
			changedata(d => d = "");
		}).catch(err => console.log(err));



		<h4> Enter in a post </h4>
		<input type = "text" onChange = {handleTopicUpdate} value = {topic}
		placeholder = "enter in a topic"/>
		<input type = "text" onChange = {handleDataUpdate} value = {data}
		placeholder = "enter in some data"/>
		<button onClick = {submitPost}> submit </button>



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
