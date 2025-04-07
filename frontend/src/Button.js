import {useState,useEffect } from "react"

function Button(props) {

	let x = props.upvotes || 0
	const [count,changeCount] = useState(x);
	let account_id = window.userStatus.id;
	const [id,changeId] = useState(props.id)
	const [logs,changeLogs] = useState({})
	useEffect(() => {
		getButtonData();
	},[]);

	let url = process.env.URL || "http://localhost:3002"
	let type = ""

	//console.log("My Id is " + id)
	let URL = ""
	if (props.postId) {
	URL = url + "/button/"+ props.id
	//	console.log("picking postButton")
	type = "post"
	}

	else if (props.replyId && id == undefined) {
	
	//	console.log("picking replyButton")
		URL = url + "/reply/replyButton/" + props.replyId
		type = "reply"
	}

	else {
		let temp = props.id || id
		URL = url + "/replyButton/"+ temp
		type = "reply"
	//	console.log("picking replyButton with own id")
	}

	//console.log(URL)
	function handleIncrement() {
		if (logs.hasUpvoted) return;
		updateButton("up");
	}

	function handleDecrement() {	
		if (logs.hasDownvoted) return;
		updateButton("down");
	}




	async function updateButton(action) {
		//console.log(URL);
		//console.log("my Id update is " +id);
		//console.log(action);
		//console.log(type);
		//console.log(account_id);
		fetch(URL,{
			method:"PUT",
			headers: {"Content-type":"application/json"},
			body: JSON.stringify({
				id: id,
				action:action,
				account_id:account_id,
				type:type,
			})

		}).
			then(response => {
				if (!response.ok) {
					if (response.status == 403) {
						return response.json().then(data => {
						changeLogs(l => {l = data.logs
						return l;});
						
					throw new Error("Response status" + response.status + data.message)

						})
					}
					return response.json().then(text => {throw new Error("Response status" + response.status + text.message + text.error)});	
				}
				return response.json()
				
			}).then(d => {

				//console.log(d.logs);
				if (action === "up") changeCount(c => c = c +1 )
				else changeCount(c => c =  c - 1)
				changeLogs(l => { l = d.logs
					return l
				})

			})
			.catch(err => console.log(err));
	}






	async function getButtonData() {

		fetch(URL).
			then(response => {
				if (!response.ok) {	
					throw new Error("Response status" + response.status);	
				}
				
				else return response.json();
			}).
			then(data => 
				{
					//console.log(data);
					//id = data.button.id;
					changeId(id =>  {
						id = data.button.id
					return id
					});
					changeCount(c =>  {c = data.button.upvotes
					
						return c;
					});
					if (props.postId) {URL = url + "/button/"+ id}
					else {
						URL = url + "/replyButton/"+ id
					
						//console.log("Changing id to " +id);
						//console.log(URL)
					}

			}).catch(err => console.log(err));
	}



	return (
		<>
		<button onClick = {handleIncrement}> + </button>
		<p> {count} </p>
		<button onClick = {handleDecrement}> - </button>
		</>

	)


}



export default Button;
