import { useState, useEffect } from "react"
import Response from "./Response.js"
import DeleteButton from "./DeleteButton.js"
import { Photo, PhotoForm } from "./Photo"
import Button from "./Button.js"
import { Rank } from "./Rank"

function Post(props) {
  const [responses, changeResponses] = useState(props.responses.reverse());
  const [photo, changePhoto] = useState(null);
  const [data, changeData] = useState("");
  const id = props.id;
  const URL = `${process.env.URL || "http://localhost:3002"}/reply/${props.id}`;
  const username = window.userStatus.username;
  const author = props.author;

  
  const handleDataUpdate = (event) => changeData(event.target.value);
  const submitResponse = () => {
    const formdata = new FormData();
    formdata.append("postId", id);
    formdata.append("description", data);
    formdata.append("topic", props.topic);
    formdata.append("author", username);
    formdata.append("reply_id", -1);
    if (photo) formdata.append("photo", photo);

    fetch(`${process.env.URL || "http://localhost:3002"}/reply`, {
      method: "POST",
      body: formdata,
    })
    .then(response => response.json())
    .then(d => {
      changeResponses(prev => [...prev, {
        topic: props.topic,
        description: data,
        id: d.replyId,
        photoId: d.photoId,
        author: username,
      }]);
    });
  };

  return (
    <div className="card">
      <h2>{props.topic}</h2>
      <p>{props.description}</p>
      <Photo photo = {photo} photo_id={props.photoId} />
      <p>Posted by {author}</p>
      <Rank author={author} />
      
      <div className="form-group">
        <input
          type="text"
          className="form-control"
          onChange={handleDataUpdate}
          placeholder="Enter your response..."
        />
      </div>
      
      <PhotoForm photo={photo} changePhoto={changePhoto} />
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button className="btn btn-primary" onClick={submitResponse}>
          Submit Response
        </button>
        <Button 
          id={props.button.id}
          upvotes={props.button.upvotes}
          postId={id}
        />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <h3>Responses</h3>
        <ul className="list-unstyled">
          {responses.map(response => (
            <Response
              key={response.id}
              id={response.id}
              description={response.description}
              timestamp={response.timestamp}
              topic={response.topic}
              author={response.author}
              photoId={response.photoId}
	      photo = {response.photo}
            />
          ))}
        </ul>
      </div>

      {window.userStatus.isAdmin && (
        <DeleteButton id={id} type={"post"} />
      )}
    </div>
  );
}

export default Post;
