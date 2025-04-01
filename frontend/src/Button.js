import {useState,useEffect } from "react"

function Button(props) {

	let x = props.upvotes || 0
	const [count,changeCount] = useState(x);

	useEffect(() => {
		getButtonData();
		return () => { 
			//updateButton(count)
		}
	},[]);

	let id = props.id;
	let url = process.env.URL || "http://localhost:3002"

	let URL = ""
	if (props.postId) {
	
	URL = url + "/button/"+ props.id

	//	console.log("picking postButton")
	}

	else if (props.replyId) {
	
	//	console.log("picking replyButton")
		URL = url + "/reply/replyButton/" + props.replyId

	}

	else {
	URL = url + "/replyButton/"+ props.id

	//	console.log("picking replyButton with own id")
	}

	//console.log(URL)
	function handleIncrement() {
		changeCount(c =>  {
			c = c+1	
			updateButton(c);
			return c;
		});
	}

	function handleDecrement() {
		changeCount(c => { c = c-1
		
			updateButton(c);
			return c;

		});
	}




	async function updateButton(upvotes) {

		//console.log(URL);
		//console.log(id);
		//console.log(count == undefined);
		//let upvotes = count;
		console.log(count);
		fetch(URL,{
			method:"PUT",
			headers: {"Content-type":"application/json"},
			body: JSON.stringify({
				id: id,
				upvotes:upvotes,
			})

		}).
			then(response => {
				if (!response.ok) {	
					throw new Error("Response status" + response.status + response.message);	
				console.log(response.status);
				}
				
			}).catch(err => console.log(err));
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
					id = data.button.id;
					changeCount(c => c = data.button.upvotes);
					if (props.postId) {URL = url + "/button/"+ id}
					else if (props.replyId) {
						URL = url + "/replyButton/"+ id}
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
