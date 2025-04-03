// ChannelContainer.js
import { Link } from "react-router"
import './App.css';

function ChannelContainer(props) {
  const path = `/Channel/${props.id}/${props.title}/${props.description}`

  return (
    <div className="card mb-3">
      <div className="p-3">
        <h4 className="text-primary mb-2">{props.title}</h4>
        <p className="text-secondary">{props.description}</p>
        <Link to={path} className="btn btn-primary mt-2">
          Select Channel
        </Link>
      </div>
    </div>
  );
}

export default ChannelContainer;
