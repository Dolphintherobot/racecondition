import { useState, useEffect } from "react"
import { Buffer } from "buffer"
import './App.css';

export function Photo(props) {
  const [photoBase64, setPhotoBase64] = useState(null);

  async function wrapper() {
    if (props.photo_id && !props.photo) {
      try {
        const photo = await getPhoto(props.photo_id);
        const photoArrayBuffer = await photo.arrayBuffer();
        const bufferData = Buffer.from(photoArrayBuffer);
        const base64String = bufferData.toString('base64');
        setPhotoBase64(base64String);
      } catch (err) {
        console.error("Error loading photo:", err);
      }
    } else if (props.photo instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result.split(',')[1]);
      };
      reader.readAsDataURL(props.photo);
    } else if (props.photo?.data) {
      const bufferData = Buffer.from(props.photo.data);
      const base64String = bufferData.toString('base64');
      setPhotoBase64(base64String);
    }
  }

  useEffect(() => {
    wrapper();
  }, [props.photo]);

  return (
    <div className="photo-container">
      {photoBase64 ? (
        <img 
          src={`data:image/jpeg;base64,${photoBase64}`} 
          alt="Uploaded content"
          className="photo-image"
        />
      ) : (
        <div className="photo-placeholder">
          <p>No photo available</p>
        </div>
      )}
    </div>
  );
}

// Rest of the original code remains unchanged
export async function getPhoto(id) {
  let url = process.env.URL || "http://localhost:3002";
  const URL = url + "/photo/" + id;

  try {
    const response = await fetch(URL);
    if (!response.ok) {
      throw new Error("Error getting photo status code " + response.status);
    }
    return await response.blob();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export function PhotoForm(props) {
  const { photo, changePhoto } = props;

  return (
    <div className="photo-upload">
      <label className="photo-upload-label">
        <span>Upload Image</span>
        <input 
          type="file" 
          onChange={(e) => changePhoto(e.target.files[0])}
          accept="image/*"
          className="photo-upload-input"
        />
      </label>
      {photo && (
        <div className="photo-preview">
          <Photo photo={photo} />
        </div>
      )}
    </div>
  );
}
