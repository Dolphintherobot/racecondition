import { useState, useEffect } from "react"
import ResponseAuthor from "./ResponseAuthor"
import DeleteButton from "./DeleteButton"
import { Photo, PhotoForm } from "./Photo"
import Button from "./Button.js"
import './App.css';

function Response(props) {
  const [responses, changeResponses] = useState([]);
  const [photo, changePhoto] = useState(null); 
  const [data, changeData] = useState("");
  const id = props.id;
  const url = process.env.URL || "http://localhost:3002";
  const URL = url + "/nestedReply/"+ props.id;
  const username = window.userStatus.username;

  useEffect(() => {
    getResponses();
  }, []);

  function handleDataUpdate(event) {
    changeData(event.target.value);
  }

  function submitResponse() {
    let formdata = new FormData();
    formdata.append("reply_id", id);
    formdata.append("description", data);
    formdata.append("topic", props.topic);
    formdata.append("author", username);
    formdata.append("postId", -1);
    
    if (photo) {
      formdata.append("photo", photo);
    }

    fetch(url + "/reply", {
      method: "POST",
      body: formdata,
    })
    .then(response => {
      if (!response.ok) {    
        throw new Error(`Response status: ${response.status}`);
      }
      return response.json();
    })
    .then(d => {
      changeResponses(prev => [
        ...prev,
        {
          topic: props.topic,
          description: data,
          id: d.replyId,
          author: username,
          photo: photo
        }
      ]);
    })
    .catch(err => console.log(err));
  }

  function getResponses() {
    fetch(URL)
    .then(response => {
      if (!response.ok) {    
        throw new Error(`Response status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => { 
      if (data.reply.length === 0) return;
      changeResponses(prev => prev.concat(data.reply));
    })
    .catch(err => console.log(err));
  }

  return (id != null ? (
    <div className="card mt-2">
      <p>{props.description}</p>
      <Photo photo={props.photo} />
      
      <div className="vote-container">
        <Button replyId={id} upvotes={0} />
      </div>

      <ul className="list-unstyled">
        {responses.map(response => (
          <Response 
            key={response.id}
            id={response.id}
            topic={props.topic}
            description={response.description} 
            timestamp={response.timestamp}
            photo={response.photo}
            author={response.author}
          />
        ))}
      </ul>

      <div className="form-group mt-2">
        <input
          type="text"
          className="form-control"
          onChange={handleDataUpdate}
          placeholder="Enter your reply..."
        />
      </div>
      
      <div className="d-flex gap-2 mt-2">
        <PhotoForm photo={photo} changePhoto={changePhoto} />
        <button 
          className="btn btn-primary"
          onClick={submitResponse}
        >
          Submit Reply
        </button>
      </div>

      <ResponseAuthor author={props.author} />
      {window.userStatus.isAdmin && (
        <DeleteButton id={id} type={"reply"} />
      )}
    </div>
  ) : null);
}

export default Response;
