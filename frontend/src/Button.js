import {useState,useEffect } from "react"

function Button(props) {

	const [count,changeCount] = useState(props.upvotes);

	useEffect(() => {
		getButtonData();
	},[]);

	let id = props.id;
	let url = process.env.URL || "http://localhost:3002"

	let URL = ""
	if (props.postId) {
	
	URL = url + "/button/"+ props.id

	}
	else {
	URL = url + "/replyButton/"+ props.id

	}

	function handleIncrement() {
		changeCount(c => c = c+1);
	}

	function handleDecrement() {
		changeCount(c => c = c-1);
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
					changeCount(c => c = data.upvotes);

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



export Default Button;
