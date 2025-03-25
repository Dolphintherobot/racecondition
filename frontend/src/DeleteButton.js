
function DeleteButton(props) {

	return (
		window.userStatus.isAdmin ?
		<p> delete away </p>
		: <p> no delete for you </p>
	);

}



export default DeleteButton;
