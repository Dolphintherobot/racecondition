import {useState,useEffect} from "react"

export function Rank(props) {

	const [rank,changeRank] = useState("");
	const [count,changeCount] = useState(0);
	let author = props.author

	let url = process.env.URL || "http://localhost:3002"
	const URL = url + "/profile/score/"+ author

	useEffect(() =>{

		getRank();

	},[])


	//grabs the number of upvotes an author has 
	//and then will update the rank accordingly
	function getRank() {
	
		fetch(URL).
			then(response => {
				if (!response.ok) {	
				throw new Error("Response status" + response.status + text.message + text.error)	
				}
				return response.json();
				
			}).
			then(data => {
			
				let upvotes = data.upvotes
				changeCount(c = > c = upvotes)
				let temp = ""
				if (upvotes < 0) {
					temp = "needs to change major and/or disciplines"
				}
				else if (upvotes < 5) {
					temp = "noob"
				}
				else if (upvotes < 10) {
					temp = "decent"
				}
				else {
					temp = "programming God"
				}
				changeRank(r => r = temp);

			})
			.catch(err => console.log(err));
	}





	}





}
