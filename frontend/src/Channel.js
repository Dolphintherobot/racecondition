import {useState,useEffect,useContext} from "react"
import Post from "./Post.js"
import DeleteButton from "./DeleteButton.js"
import {useParams} from "react-router"
import {PhotoForm} from "./Photo"
export default Channel;

function Channel(props) {

	const [posts,changePosts] = useState([]);

	//const user = useContext(UserContext);
	useEffect(() => {
		getChannelData()
	},[]);

	//the data button
	const [data,changeData] = useState("");

	//the topic button
	const [topic,changeTopic] = useState("");
	const [photo,changePhoto] = useState(null);

	


	const {id,title,description}= useParams();

	/*
	let id = props.id;
	let title = props.title;
	let description = props.description;
	*/
	let url = process.env.URL || "http://localhost:3002"
	const URL = url + "/channelData/"+ id
	let username  = window.userStatus.username;

	let isLoggedIn = props.isLoggedIn;
	

	function handleDataUpdate(event) {
		changeData(d => d = event.target.value);
	}

	function handleTopicUpdate(event) {
		changeTopic(t => t = event.target.value);
	}


	function submitPost() {

		let formData = new FormData();
    		formData.append("topic",topic);
    		formData.append("description", data);
    		formData.append("channelId", id); 
    		formData.append("author", username); 
		
		let photoInput = photo;
		if (photoInput) {
        		formData.append("photo", photoInput);
    }


		let thetopic = topic;
		let thedata = data;
		fetch(url + "/post", {
			method: "POST",
			body:formData			
		}).then(response => {
			if (!response.ok) {	
				throw new Error(`response status: ${response.status}`)
			}
			else return response.json();

		}).then(d => {
			let x = {
				topic:thetopic,
				description:thedata,
				id:d.postId,
				responses:[],
				button:0,
				author:username,
				photo:photoInput,
			}
			//console.log(x);
			changePosts( prev => { 
			prev = [...prev,x] //adds the new document to the array 	
			return prev;
			})

			//console.log(posts);
			changeTopic(t => t = "");
			changeData(d => d = "");
		}).catch(err => console.log(err));

	}









	//given some data from the /channelData request
	//will clean it to put into proper format
	
	function cleanData(data)
	{
		//console.log(typeof data);

		let newPosts = []

		data.forEach((element) => {
		
			let post = newPosts.find(e => e.id == element.postId);
			if (post) {

			

				let r  = post.responses.find( e => e.id == element.replyId)
				if (r) {return;}

				post.responses.push( {
					id:element.replyId,
					topic:element.replyTopic,
					description:element.replyDescription,
					author:element.replyAuthor,
					photo:element.replyPhoto,
					button: {id:element.replyId},
				});

			}
			else {
				let post = {
					id:element.postId,
					topic:element.postTopic,
					description:element.postDescription,
					author:element.postAuthor,
					photo:element.postPhoto,
					responses:[{
						id:element.replyId,
						topic:element.replyTopic,
						description:element.replyDescription,
						author:element.replyAuthor,
						photo:element.replyPhoto,
						button: {id:element.replyId}
					}],
					button: {id:element.buttonId,upvotes:element.upvotes,postId:element.postId}
				}
				newPosts.push(post);
			}

		});

		changePosts(p => p = p.concat(newPosts));

		console.log(newPosts);

	}

	//grabs everything, except nested replies from the backend
	async function getChannelData() {

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

		<h2> {title}  </h2>

		<ul>

		{posts.map( p =>
			{
				return <Post 
				id = {p.id}
				topic = {p.topic}
				description = {p.description}
				responses = {p.responses}
				button = {p.button}
				author = {p.author}
				photo = {p.photo}
				/>
			}
		)}
		</ul>
	
		<h4> Enter in a post </h4>
		<input type = "text" onChange = {handleTopicUpdate} value = {topic}
		placeholder = "enter in a topic"/>
		<input type = "text" onChange = {handleDataUpdate} value = {data}
		placeholder = "enter in some data"/>
		<h4> enter a file to upload </h4>
		<PhotoForm photo = {photo} changePhoto = {changePhoto} />
		<button onClick = {submitPost}> submit </button>

		<DeleteButton id = {id} type = {"channel"}/>
	</div>

	)

}






