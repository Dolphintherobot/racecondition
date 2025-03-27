import ChannelList from "./ChannelList"
import {useState,useEffect} from "react"
import ChannelContainer from "./ChannelContainer.js"
import DeleteButton from "./DeleteButton.js"

function Account(props) 
{

	const display = window.userStatus.isLoggedIn
	let url = process.env.URL || "http://localhost:3002"
	const URL = url + "/account"

	const [accounts,changeAccounts] = useState([]);

	//console.log("I am here");

	useEffect( () => {
	getAccounts();
	},[]);

	async function getAccounts() {

		fetch(URL).
			then(response => {
				if (!response.ok) {	
					throw new Error("Response status" + response.status);
				}
				else return response.json();
			}).
			then(d => 
				{
					changeAccounts(c => { 
						c= c.concat(d);
						return c;
					}
					)
					//console.log(d.channels);
				}).catch(err => console.log(err));

	}




	return (

		<div>

		<h2> Accounts </h2>

		<ul>

		{accounts.map( a =>
			{
				return <Container
				id = {a.id}
				username = {a.username}
				/>
			}
		)}
		</ul>

		</div>


	)



}

function Container(props) {


	return ( <>
		<p> {props.username} </p>
		<DeleteButton id = {props.id} type = "account"/>
		</>
	)

}


export default Account;
