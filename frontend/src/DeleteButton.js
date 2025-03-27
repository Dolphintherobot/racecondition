import {useNavigate} from "react-router"


function DeleteButton(props) {

	const navigate = useNavigate();
	
	let id = props.id
	let type = props.type; //type of object are we deleting?

	
	let url = process.env.URL || "http://localhost:3002"
	

	function deleteAccount() {
	
		fetch(url + "/account/" + id, {
			method: "DELETE",
		}).then(response => {
			if (!response.ok) {	
				throw new Error(`Response status: ${response.status}`)
				return;
			}
			window.alert("Account deleted succesfully");
			return;
		})
	}
	
	function deleteChannel() {
	
		fetch(url + "/channel/" + id, {
			method: "DELETE",
		}).then(response => {
			if (!response.ok) {	
				throw new Error(`Response status: ${response.status}`)
				return;
			}
			window.alert("Channel deleted succesfully");
			navigate("/");
			return;
		})
	}
	
	function deletePost() {
	
		fetch(url + "/post/" + id, {
			method: "DELETE",
		}).then(response => {
			if (!response.ok) {	
				throw new Error(`Response status: ${response.status}`)
				return;
			}
			window.alert("Post deleted succesfully");
			return;
		})
	}
	
	function deleteReply() {
	
		fetch(url + "/reply/" + id, {
			method: "DELETE",
		}).then(response => {
			if (!response.ok) {	
				throw new Error(`Response status: ${response.status}`)
				return;
			}
			window.alert("Response deleted succesfully");
			return;
		})
	}




	function Delete() {
	
		if (type === "post") {deletePost()}
		else if (type === "channel") {deleteChannel()}
		else if (type === "account") {deleteAccount()}
		else if (type === "reply") {deleteReply()}

	}

	return (
		window.userStatus.isAdmin ?
		<button onClick = {Delete} > delete {type} </button>
		: <p> </p>
	);

}



export default DeleteButton;
