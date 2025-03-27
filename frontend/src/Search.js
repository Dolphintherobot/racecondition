import ChannelList from "./ChannelList"
import {useState,useEffect} from "react"
import {useParams} from "react-router"
import ChannelContainer from "./ChannelContainer.js"
function Search(props) 
{

	const [channels,changeChannels] = useState([])
	const {query} = useParams();
	let url = process.env.URL || "http://localhost:3002"
	const URL = url + "/channel/search"

	//console.log("I am here");

	useEffect( () => {
	getChannels();
	},[]);

	//grabs everything, except nested replies from the backend
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
					console.log(d.channels);
				}).catch(err => console.log(err));

	}




	return (

		<div>

		<h2> Channels  </h2>

		<ul>

		{channels.map( c =>
			{
				return <ChannelContainer
				id = {c.id}
				title = {c.title}
				description = {c.description}
				/>
			}
		)}
		</ul>

		</div>


	)



}


export default Search;
