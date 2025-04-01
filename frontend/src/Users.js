import {useState,useEffect} from "react"
import {useParams,Link} from "react-router"


export function Users() {


	const display = window.userStatus.isLoggedIn
	const [channels,changeChannels] = useState([])
	const {query} = useParams();
	let url = process.env.URL || "http://localhost:3002"
	const URL = url + "/channel/search"

	//console.log("I am here");

	useEffect( () => {
	getChannels();
	},[]);

	async function getChannels() {

		fetch(URL,{
			method: "POST",
			headers: {"content-type":"application/json"},
			body:JSON.stringify( {
				query:query,
			},
			)}).
			then(response => {
				if (!response.ok) {	
					throw new Error("Response status" + response.status);
				}
				else return response.json();
			}).
			then(d => 
				{
					changeChannels(c => { 
						c= c.concat(d.channels);
						return c;
					}
					)
					//console.log(d.channels);
				}).catch(err => console.log(err));

	}



	return (display?

		<div>

		<h2> Channels  </h2>

		<ul>

		{channels.map( c =>
			{ return <></>
			}
		)}
		</ul>

		</div>
		:
		<p> log in before being able to view the results of a search query </p>


	)





}





export function UserContainer(props) {

	const path = `/Channel/${props.id}/${props.title}/${props.description}`

	return (
		<div>
		<h4> {props.title} </h4>
		<p> {props.description} </p>
		<Link to = {path}> <button> select </button> </Link>
		</div>
	)

}




export function Profile(props) {
}
