import {useState,useEffect} from "react"
import Post from "./Post.js"

function Channel(props) {

	const [posts,changePosts] = useState([]);

	useEffect(() => {
		getChannelData()
	},[]);

	let id = props.id;
	let title = props.title;
	let description = props.description;
	let url = process.env.URL || "http://localhost:3002"
	const URL = url + "/channelData/"+ props.id

	
	//given some data from the /channelData request
	//will clean it to put into proper format
	
	function cleanData(data)
	{
		//console.log(typeof data);


		let newPosts = []

		data.forEach((element) => {
		
			let post = newPosts.find(e => e.postId == element.id);
			console.log(post)
			if (post) {
	
				let r  = post.responses.find( e => e.id = element.replyId)
				if (r) {return;}

				post.responses.push( {
					id:element.replyId,
					topic:element.replyTopic,
					description:element.replyDescription,
				});

			}
			else {
				let post = {
					id:element.postId,
					topic:element.postTopic,
					description:element.postDescription,
					responses:[{
						id:element.replyId,
						topic:element.replyTopic,
						description:element.replyDescription}],
					button: {id:element.buttonId,upvotes:element.upvotes}
				}
				newPosts.push(post);
			}

		});

		changePosts(p => p = p.concat(newPosts));

	}

	//grabs everything, except nested replies from the backend
	function getChannelData() {

		fetch(URL).
			then(response => {
				if (!response.ok) {	
					throw new Error("Response status" + response.status);
				}
				else return response.json();
			}).
			then(data => 
				{
					cleanData(data.result)
				}).catch(err => console.log(err));

	}


	return (

		<div>

		<h2> {title} </h2>

		<ul>

		{posts.map( p =>
			{
				return <Post 
				id = {p.id}
				topic = {p.topic}
				description = {p.description}
				responses = {p.responses}
				button = {p.button}
				/>
			}
		)}
		</ul>

		</div>

	)





}

export default Channel;
