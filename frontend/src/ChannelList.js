import { useParams } from "react-router"
import './App.css';

function ChannelList() {
  const { query } = useParams();

  return (
    <div className="container">
      <div className="card">
        <h2>Channels</h2>
        <p>Search results for: {query}</p>
        <div className="list-unstyled">
          {/* Channels would be rendered here */}
        </div>
      </div>
    </div>
  );
}

export default ChannelList;
