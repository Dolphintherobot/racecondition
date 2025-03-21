import {useState,useEffect} from "./react"
import Post from ".post"

function Channel(props) {

	const [posts,changePosts] = useState([]);

	useEffect(() => {getChannelData()
	},[]);

	let id = props.id;
	let url = process.env.URL || "http://localhost:3002"
	const URL = url + "/channelData/"+ props.id

	
	//given some data from the /channelData request
	//will clean it to put into proper format
	
	function cleanData(data)
	{

		let newPosts = []

		data.foreach((element) => {
		
			let post = newPosts.find(e => e.postId == element.postId);
			if (post) {
			
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
				newPosts.push(posts);
			}

		});

		changePosts(p => p = p.concat(newPosts);

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
			then(data => cleanData(data)).catch(err => console.log(err));

	}






}

export default Channel;
