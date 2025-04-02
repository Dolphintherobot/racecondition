import {useState} from "react"
import {useEffect} from "react"
export function Photo(props) {
    const [photoBase64, setPhotoBase64] = useState(null);

    // This function converts File (from FormData) to Base64 string
    function convertFileToBase64(file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            // Set the base64 string to the state
            setPhotoBase64(reader.result.split(',')[1]);  // Remove the prefix
        };
        reader.readAsDataURL(file);  // This converts file to base64 format
    }

	//console.log(props.photo);
	useEffect(() => {
        if (props.photo instanceof File) {
            // If the photo is directly a File (not FormData), convert it to base64
            convertFileToBase64(props.photo);
        } else if (props.photo && props.photo instanceof FormData) {
            // Check if it's FormData
            const file = props.photo.get('file'); // Get the file from FormData
            if (file) {
                convertFileToBase64(file);  // Convert the file to base64
            }
        } else if (props.photo && props.photo.data) {
            // If photo is in Buffer format (from DB or server), convert it to base64
            const bufferData = Buffer.from(props.photo.data);
            const base64String = bufferData.toString('base64');
            setPhotoBase64(base64String);
        }
    }, [props.photo]);    return (
        photoBase64 ? (
            <img src={`data:image/jpeg;base64,${photoBase64}`} alt="Account Photo" />
        ) : (
            <p>No photo available</p>
        )
    );
}


export async function getPhoto(id) {
	let url = process.env.URL || "http://localhost:3002"
	const URL = url + "/photo/"+id


	try {

		let response = await fetch(URL);
		if (!response.ok) {
		throw new Error("Error getting photo status code" +response.status);
		}
		let photo = await response.blob()
		return photo;

	}

	catch (err) {	
		console.log(err);
	}



}


export function PhotoForm(props) {

	//pass in useState stuff into props
	const {photo,changePhoto} = props;

	function fileChangedHandler(event) {
  		changePhoto(p => p = event.target.files[0])
	}

return (
	<div>
	<input type="file" onChange={fileChangedHandler}/>	
	</div>
	)
}



