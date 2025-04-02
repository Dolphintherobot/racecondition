import DeleteButton from "./DeleteButton"
import {useParams} from "react-router"

export function ChannelList(props) {

	const {query} = useParams();



	return (
		<>
			<p> welcome to a list of channels </p>
			<DeleteButton/>
		</>
	)

}


export default ChannelList;

