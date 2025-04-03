import { useState } from "react"
import { PhotoForm } from "./Photo"
import DeleteButton from "./DeleteButton.js"
import { useNavigate } from "react-router"
import './App.css';

function CreateChannel() {
  const [data, changeData] = useState("");
  const [topic, changeTopic] = useState("");
  const [photo, changePhoto] = useState(null);
  const navigate = useNavigate();
  const username = window.userStatus.username;
  const url = process.env.URL || "http://localhost:3002";
  const URL = url + "/channel";
  const isLoggedIn = window.userStatus.isLoggedIn;

  const handleDataUpdate = (event) => changeData(event.target.value);
  const handleTopicUpdate = (event) => changeTopic(event.target.value);

  const submitChannel = () => {
    const formdata = new FormData();
    formdata.append("title", topic);
    formdata.append("description", data);
    formdata.append("username", username);
    if (photo) formdata.append("photo", photo);

    fetch(URL, {
      method: "POST",
      body: formdata,
    })
    .then(response => {
      if (!response.ok) throw new Error(`Response status: ${response.status}`);
      return response.json();
    })
    .then(d => {
      navigate(`/Channel/${d.channelId}/${d.title}/${d.description}`);
      window.alert("Channel successfully created");
      changeTopic("");
      changeData("");
    })
    .catch(err => {
      window.alert("Error creating channel: " + err);
      console.log(err);
    });
  };

  return isLoggedIn ? (
    <div className="container">
      <div className="card">
        <div className="p-3">
          <h2 className="text-primary mb-4">Create New Channel</h2>
          
          <div className="form-group">
            <label className="text-primary">Channel Title</label>
            <input
              type="text"
              className="form-control"
              onChange={handleTopicUpdate}
              value={topic}
              placeholder="Enter channel title"
            />
          </div>

          <div className="form-group">
            <label className="text-primary">Description</label>
            <input
              type="text"
              className="form-control"
              onChange={handleDataUpdate}
              value={data}
              placeholder="Enter channel description"
            />
          </div>

          <div className="form-group">
            <label className="text-primary">Channel Cover Image</label>
            <PhotoForm photo={photo} changePhoto={changePhoto} />
          </div>

          <div className="d-flex gap-2 mt-4">
            <button 
              className="btn btn-primary"
              onClick={submitChannel}
            >
              Create Channel
            </button>
            <DeleteButton />
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="container">
      <div className="card p-3">
        <p className="text-secondary">
          Please log in to create a channel
        </p>
      </div>
    </div>
  );
}

export default CreateChannel;
