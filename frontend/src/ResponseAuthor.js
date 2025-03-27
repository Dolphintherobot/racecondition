
function ResponseAuthor(props) {

	return ( {props.author}?
		<p> written by {props.author}</p>
		:
		<></>
	)



}




export default ResponseAuthor;
