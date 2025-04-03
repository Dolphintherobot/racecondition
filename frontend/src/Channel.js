import { useState, useEffect } from "react"
import { useParams } from "react-router"
import Post from "./Post.js"
import DeleteButton from "./DeleteButton.js"
import { PhotoForm } from "./Photo"
import './App.css';

function Channel() {
  const [posts, changePosts] = useState([]);
  const [data, changeData] = useState("");
  const [topic, changeTopic] = useState("");
  const [photo, changePhoto] = useState(null);
  const { id, title, description } = useParams();
  const url = process.env.URL || "http://localhost:3002";
  const URL = `${url}/channelData/${id}`;
  const username = window.userStatus.username;

  useEffect(() => {
    getChannelData();
  }, []);

  function handleDataUpdate(event) {
    changeData(event.target.value);
  }

  function handleTopicUpdate(event) {
    changeTopic(event.target.value);
  }

  function submitPost() {
    const formData = new FormData();
    formData.append("topic", topic);
    formData.append("description", data);
    formData.append("channelId", id);
    formData.append("author", username);
    
    if (photo) {
      formData.append("photo", photo);
    }

    fetch(`${url}/post`, {
      method: "POST",
      body: formData,
    })
    .then(response => response.json())
    .then(d => {
      const newPost = {
        topic: topic,
        description: data,
        id: d.postId,
        responses: [],
        button: 0,
        author: username,
        photo: photo,
      };
      changePosts(prev => [...prev, newPost]);
      changeTopic("");
      changeData("");
      changePhoto(null);
    })
    .catch(err => console.log(err));
  }

  function cleanData(data) {
    const newPosts = [];
    data.forEach(element => {
      let post = newPosts.find(e => e.id === element.postId);
      if (post) {
        const existingResponse = post.responses.find(e => e.id === element.replyId);
        if (!existingResponse) {
          post.responses.push({
            id: element.replyId,
            topic: element.replyTopic,
            description: element.replyDescription,
            author: element.replyAuthor,
            photo: element.replyPhoto,
            button: { id: element.replyId }
          });
        }
      } else {
        newPosts.push({
          id: element.postId,
          topic: element.postTopic,
          description: element.postDescription,
          author: element.postAuthor,
          photo: element.postPhoto,
          responses: [{
            id: element.replyId,
            topic: element.replyTopic,
            description: element.replyDescription,
            author: element.replyAuthor,
            photo: element.replyPhoto,
            button: { id: element.replyId }
          }],
          button: { id: element.buttonId, upvotes: element.upvotes, postId: element.postId }
        });
      }
    });
    changePosts(prev => [...prev, ...newPosts]);
  }

  function getChannelData() {
    fetch(URL)
      .then(response => {
        if (!response.ok) throw new Error(`Response status: ${response.status}`);
        return response.json();
      })
      .then(data => cleanData(data.result))
      .catch(err => console.log(err));
  }

  return (
    <div className="container">
      <div className="card">
        <h2>{title}</h2>
        <p className="text-muted">{description}</p>

        <div className="mt-4">
          <h3>Create New Post</h3>
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              value={topic}
              onChange={handleTopicUpdate}
              placeholder="Post title"
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              value={data}
              onChange={handleDataUpdate}
              placeholder="Post content"
            />
          </div>
          <div className="form-group">
            <PhotoForm photo={photo} changePhoto={changePhoto} />
          </div>
          <button 
            className="btn btn-primary"
            onClick={submitPost}
          >
            Create Post
          </button>
        </div>

        <div className="mt-4">
          <h3>Posts</h3>
          <div className="list-unstyled">
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
        </div>

        {window.userStatus.isAdmin && (
          <div className="mt-3">
            <DeleteButton id={id} type={"channel"} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Channel;
