import { useState, useEffect } from "react"
import { useParams } from "react-router"
import { PhotoForm } from "./Photo"
import Post from "./Post.js"
import DeleteButton from "./DeleteButton.js"

function Channel(props) {
  
  const [posts, changePosts] = useState([]);
  const [data, changeData] = useState("");
  const [topic, changeTopic] = useState("");
  const [photo, changePhoto] = useState(null);
  const { id, title, description } = useParams();
  const URL = `${process.env.URL || "http://localhost:3002"}/channelData/${id}`;
  const username = window.userStatus.username;

  const handleDataUpdate = (event) => changeData(event.target.value);
  const handleTopicUpdate = (event) => changeTopic(event.target.value);
  const submitPost = () => {
    const formData = new FormData();
    formData.append("topic", topic);
    formData.append("description", data);
    formData.append("channelId", id);
    formData.append("author", username);
    if (photo) formData.append("photo", photo);

    fetch(`${process.env.URL || "http://localhost:3002"}/post`, {
      method: "POST",
      body: formData,
    })
    .then(response => response.json())
    .then(d => {
      changePosts(prev => [...prev, {
        topic: topic,
        description: data,
        id: d.postId,
        responses: [],
        button: 0,
        author: username,
        photo: photo,
      }]);
    });
  };

  return (
    <div className="container">
      <div className="card">
        <h2>{title}</h2>
        <p>{description}</p>

        <div className="form-group">
          <input
            type="text"
            className="form-control"
            onChange={handleTopicUpdate}
            placeholder="Post topic"
          />
        </div>
        
        <div className="form-group">
          <input
            type="text"
            className="form-control"
            onChange={handleDataUpdate}
            placeholder="Post content"
          />
        </div>
        
        <PhotoForm photo={photo} changePhoto={changePhoto} />
        
        <button className="btn btn-primary" onClick={submitPost}>
          Create Post
        </button>

        <div style={{ marginTop: '2rem' }}>
          {posts.map(p => (
            <Post
              key={p.id}
              id={p.id}
              topic={p.topic}
              description={p.description}
              responses={p.responses}
              button={p.button}
              author={p.author}
              photo={p.photo}
            />
          ))}
        </div>

        {window.userStatus.isAdmin && (
          <DeleteButton id={id} type={"channel"} />
        )}
      </div>
    </div>
  );
}

export default Channel;
