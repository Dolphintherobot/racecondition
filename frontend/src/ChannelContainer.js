import {Link} from "react-router"

function ChannelContainer(props) {

	const path = `/Channel/${props.id}/${props.title}/${props.description}`

	return (
		<div>
		<h4> {props.title} </h4>
		<p> {props.description} </p>
		<Link to = {path}> <button> select </button> </Link>
		</div>
	)
}


export default ChannelContainer
