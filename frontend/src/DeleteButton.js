import { useNavigate } from "react-router"
import './App.css';

function DeleteButton(props) {
  const navigate = useNavigate();

  const deleteActions = {
    account: () => fetch(`${process.env.URL || "http://localhost:3002"}/account/${props.id}`, { 
      method: "DELETE" 
    }),
    channel: () => fetch(`${process.env.URL || "http://localhost:3002"}/channel/${props.id}`, { 
      method: "DELETE" 
    }).then(() => navigate("/")),
    post: () => fetch(`${process.env.URL || "http://localhost:3002"}/post/${props.id}`, { 
      method: "DELETE" 
    }),
    reply: () => fetch(`${process.env.URL || "http://localhost:3002"}/reply/${props.id}`, { 
      method: "DELETE" 
    })
  };

  return window.userStatus.isAdmin ? (
    <button
      className="btn btn-danger btn-sm"
      onClick={() => {
        deleteActions[props.type]()
          .then(() => window.alert("Delete successful"))
          .catch(err => {
            window.alert("Delete failed: " + err.message);
            console.error(err);
          });
      }}
    >
      Delete {props.type}
    </button>
  ) : null;
}

export default DeleteButton;
