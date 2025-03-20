'use strict';



const cors = require("cors");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const mysql = require("mysql2");

const PORT = 8080;
const DOCKER_IP = "172.23.0.2";  // You may not need this anymore


//try connecting to sql database
const con = mysql.createPool({
    host: process.env.DB_HOST || "mysql1",
    port: process.env.DB_PORT || "3306",
    user: process.env.DB_USER || "user1",
    password: process.env.DB_PASSWORD || "user1_xxx",
    database: process.env.DB_DATABASE || "my_database",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,  // 10 seconds timeout,,
    multipleStatements:true,
});



con.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(-1);
    }
    console.log('Successfully connected to the database');
    connection.release();  // Don't forget to release the connection
});

const sql = con.promise();
//try connecting to the couchdb database
//const COUCHDB_URL = process.env.COUCHDB_URL || 'http://admin:password@localhost:5984';
//const COUCHDB_DB = process.env.COUCHDB_DB || 'questionsdb';

//const nano = require('nano')(COUCHDB_URL)
//nano.auth("admin","password");


/*
const createTablesQuery = `
  CREATE TABLE IF NOT EXISTS channel (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS post (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      topic VARCHAR(255) NOT NULL,
      description TEXT,
      photo VARCHAR(255),
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (channelId) REFERENCES channel(id) ON DELETE CASCADE
  );

  CREATE INDEX idx_post_photo ON post(photo);

  CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      photo BLOB NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reply (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      topic VARCHAR(255) NOT NULL,
      description TEXT,
      post_id INTEGER,
      reply_id INTEGER,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
      FOREIGN KEY (reply_id) REFERENCES reply(id) ON DELETE CASCADE
  );

  CREATE INDEX  idx_reply_post_id ON reply(post_id);

  CREATE TABLE IF NOT EXISTS button (
      id INT PRIMARY KEY AUTO_INCREMENT,
      upvotes INT DEFAULT 0,
      post_id INT,
      FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE
  );

  CREATE INDEX  idx_button_post_id ON button(post_id);
`;
*/


const createTablesQuery = `
CREATE TABLE IF NOT EXISTS channel (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS post (
    id INT PRIMARY KEY AUTO_INCREMENT,
    topic VARCHAR(255) NOT NULL,
    description TEXT,
    photo VARCHAR(255),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    channelId INT,
    FOREIGN KEY (channelId) REFERENCES channel(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS photos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    photo BLOB NOT NULL
);

CREATE TABLE IF NOT EXISTS reply (
    id INT PRIMARY KEY AUTO_INCREMENT,
    topic VARCHAR(255) NOT NULL,
    description TEXT,
    post_id INT,
    reply_id INT,  -- reference to reply(id) for nested replies
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_id) REFERENCES reply(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS button (
    id INT PRIMARY KEY AUTO_INCREMENT,
    upvotes INT DEFAULT 0,
    post_id INT,
    FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE
);


`



//try grabbing the tables for sql 
sql.query(createTablesQuery).catch(err => console.log("error with database" + err));
/*
try{
const couch = nano.use(COUCHDB_DB);
	}
catch (err) {

	console.log(err);
	nano.create(COUCHDB_DB);
	db = nano.use(COUCHDB_DB);

}
const couch = nano.use(COUCHDB_DB);
*/

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(express.json());
app.use(cors());

app.get('/', (req,res) => {

	res.sendFile(path.join(__dirname, '/posting.html'));


})



/*all the lovely stuff to do with channels*/

app.get("/channel", async (req,res) => {

	let query = "SELECT * FROM channel"

	sql.query(query).
		then(d =>  {
		
			let [data] = d;

			res.send({channels:data});
		}).
		catch(err => console.log(err)) ;

	

});


app.get("/channel/:id", async (req, res) => {
    const { id } = req.params;

    if (!id) return res.status(400).send({ message: "No channel ID provided" });

    const query = "SELECT * FROM channel WHERE id = ?";

    try {
        const [channel] = await sql.query(query, [id]);

        if (channel.length === 0) {
            return res.status(404).send({ message: "Channel not found" });
        }

        res.send({ channel: channel[0] });
    } catch (err) {
        console.error("Error fetching channel:", err);
        res.status(500).json({ error: "Failed to fetch channel" });
    }
});





app.post("/channel",async  (req,res) => { 

	let title = req.body.title;
	let description  = req.body.description;
	
	let responseObject = {channelId:0,postId:0,title:title,description,description}

	let channelQuery = "INSERT INTO channel (title,description) VALUES (?,?)"
	let postQuery = "INSERT INTO post (topic,description,channelId) VALUES (?,?,?)"

	sql.query(channelQuery,[title,description]).
		then( r => {
		let [response] = r;	
		responseObject.channelId = response.insertId

		sql.query(postQuery,[title,description,responseObject.channelId]).
			then( d =>{
				let [data] = d;
				responseObject.postId = data.insertId;

				res.send(responseObject);
				})
		

			})


});



app.put("/channel/:id",async (req,res) => {

	/*data has be be in the format
	 * id -> id you wish to update
	 * topic --> topic you wish to update 
	 * description you wish to update
	 */

	let id = req.params.id

	if (!id) {
	
		res.status(404).send({message:"no id given"});

	}

	let title = req.body.title
	let description = req.body.description;

	const q = "UPDATE channel SET title = ?,description = ? WHERE id = ?"

	try {
		const  connection = await sql.getConnection();

	try {
		await connection.beginTransaction();
		let result = await connection.query(q,[title,description,id]);
		if (result.affectRows == 0) {
		
			throw new Error("Updating channel Failed");

		}

		await connection.commit();
		//204 is ok but I am not sending you anything
		res.status(204).end();
	}

	catch (err) {
		connection.rollback();
		console.log(err);
		//409 stands for resource conflict 
		res.status(409).json({message:"attempting to update channel simulatenously with another user error message:" + err.message});

		}
	
		finally { connection.release();}

	}

		catch (err) { 
			console.error("Database COnnection Error",err);
			res.status(500).json({error:"Database error"})
		}



});


app.delete("/channel/:id", async (req,res) => {

	let id = req.params.id;

	if (!id) {
	
		res.status(404).send({message:"no id given"});

	}



	let q = "DELETE FROM channel where id = ?"

	sql.query(q,[id]).
		then( r => {
			let [result] = r;
			if (result.affectedRows == 0) {
				//409 stands for resource conflict 
				res.status(409).send({message:"attempting to delete non existance channel"});

			}
			else {
				//204 stands for succesfull process of request
				//but not returning any data
				res.status(204).send();
			}

		
		})
	


})




/**********************POST CRUD **********************/

// GET /post
app.get("/post", async (req, res) => {
    const query = "SELECT * FROM post";
    try {
        const [posts] = await sql.query(query);
        res.send({ posts });
    } catch (err) {
        console.error("Error fetching posts:", err);
        res.status(500).json({ error: "Failed to fetch posts" });
    }
});


app.get("/post/:id", async (req, res) => {
    const { id } = req.params;

    if (!id) return res.status(400).send({ message: "No post ID provided" });

    const query = "SELECT * FROM post WHERE id = ?";

    try {
        const [post] = await sql.query(query, [id]);

        if (post.length === 0) {
            return res.status(404).send({ message: "Post not found" });
        }

        res.send({ post: post[0] });
    } catch (err) {
        console.error("Error fetching post:", err);
        res.status(500).json({ error: "Failed to fetch post" });
    }
});



app.post("/post", async (req, res) => {
    const { topic, description, channelId, photo } = req.body;
    const query = "INSERT INTO post (topic, description, photo, channelId) VALUES (?, ?, ?, ?)";

    const connection = await sql.getConnection();
    const [result] = await connection.query(query, [topic, description, photo, channelId]);
    res.status(201).send({ postId: result.insertId });
    connection.release();
    
});



app.put("/post/:id", async (req, res) => {
    const { topic, description} = req.body;
    const { id } = req.params;

	//for right now make it so we cannot update a photo once it 
	//has been created, this may change
    const query = "UPDATE post SET topic = ?, description = ? WHERE id = ?";

    if (!id) return res.status(404).send({ message: "No post ID provided" });

    const connection = await sql.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query(query, [topic, description, id]);

        if (result.affectedRows === 0) return res.status(404).send({ message: "Post not found" });

        await connection.commit();
        res.status(204).end();
    } catch (err) {
        await connection.rollback();
        console.error("Error updating post:", err);
        res.status(500).json({ error: "Failed to update post" });
    } finally {
        connection.release();
    }
});


app.delete("/post/:id", async (req, res) => {
    const { id } = req.params;

    if (!id) return res.status(404).send({ message: "No post ID provided" });

    const query = "DELETE FROM post WHERE id = ?";

    try {
        const [result] = await sql.query(query, [id]);

        if (result.affectedRows === 0) return res.status(404).send({ message: "Post not found" });

        res.status(204).end();
    } catch (err) {
        console.error("Error deleting post:", err);
        res.status(500).json({ error: "Failed to delete post" });
    }
});



/*#################### REPLIES #######################*/


// GET /reply
app.get("/reply", async (req, res) => {
    const query = "SELECT * FROM reply";
    try {
        const [replies] = await sql.query(query);
        res.send({ replies });
    } catch (err) {
        console.error("Error fetching replies:", err);
        res.status(500).json({ error: "Failed to fetch replies" });
    }
});


app.get("/reply/:id", async (req, res) => {
    const { id } = req.params;

    if (!id) return res.status(400).send({ message: "No reply ID provided" });

    const query = "SELECT * FROM reply WHERE id = ?";

    try {
        const [reply] = await sql.query(query, [id]);

        if (reply.length === 0) {
            return res.status(404).send({ message: "Reply not found" });
        }

        res.send({ reply: reply[0] });
    } catch (err) {
        console.error("Error fetching reply:", err);
        res.status(500).json({ error: "Failed to fetch reply" });
    }
});




// POST /reply
app.post("/reply", async (req, res) => {
    const { topic, description, post_id, reply_id } = req.body;
    const query = "INSERT INTO reply (topic, description, post_id, reply_id) VALUES (?, ?, ?, ?)";

    try {
        const [result] = await sql.query(query, [topic, description, post_id, reply_id]);
        res.status(201).send({ replyId: result.insertId });
    } catch (err) {
        console.error("Error creating reply:", err);
        res.status(500).json({ error: "Failed to create reply" });
    }
});

// DELETE /reply/:id
app.delete("/reply/:id", async (req, res) => {
    const { id } = req.params;

    if (!id) return res.status(404).send({ message: "No reply ID provided" });

    const query = "DELETE FROM reply WHERE id = ?";

    try {
        const [result] = await sql.query(query, [id]);

        if (result.affectedRows === 0) return res.status(404).send({ message: "Reply not found" });

        res.status(204).end();
    } catch (err) {
        console.error("Error deleting reply:", err);
        res.status(500).json({ error: "Failed to delete reply" });
    }
});


app.put("/reply/:id", async (req, res) => {
    const { topic, description } = req.body;
    const { id } = req.params;
    const query = "UPDATE reply SET topic = ?, description = ? WHERE id = ?";

    if (!id) return res.status(404).send({ message: "No post ID provided" });

    const connection = await sql.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query(query, [topic, description, id]);

        if (result.affectedRows === 0) return res.status(404).send({ message: "Post not found" });

        await connection.commit();
        res.status(204).end();
    } catch (err) {
        await connection.rollback();
        console.error("Error updating post:", err);
        res.status(500).json({ error: "Failed to update post" });
    } finally {
        connection.release();
    }
});


/****############ BUTTONS ########## **********/

app.get("/button", async (req, res) => {
    const query = "SELECT * FROM button";
    try {
        const [buttons] = await sql.query(query);
        res.send({ buttons });
    } catch (err) {
        console.error("Error fetching buttons:", err);
        res.status(500).json({ error: "Failed to fetch buttons" });
    }
});

app.get("/button/:id", async (req, res) => {
    const { id } = req.params;

    if (!id) return res.status(400).send({ message: "No button ID provided" });

    const query = "SELECT * FROM button WHERE id = ?";

    try {
        const [button] = await sql.query(query, [id]);

        if (button.length === 0) {
            return res.status(404).send({ message: "Button not found" });
        }

        res.send({ button: button[0] });
    } catch (err) {
        console.error("Error fetching button:", err);
        res.status(500).json({ error: "Failed to fetch button" });
    }
});




app.post("/button", async (req, res) => {
    const { upvotes, post_id } = req.body;
    const query = "INSERT INTO button (upvotes, post_id) VALUES (?, ?)";

    try {
        const [result] = await sql.query(query, [upvotes, post_id]);
        res.status(201).send({ buttonId: result.insertId });
    } catch (err) {
        console.error("Error creating button:", err);
        res.status(500).json({ error: "Failed to create button" });
    }
});



app.delete("/button/:id", async (req, res) => {
    const { id } = req.params;

    if (!id) return res.status(404).send({ message: "No button ID provided" });

    const query = "DELETE FROM button WHERE id = ?";

    try {
        const [result] = await sql.query(query, [id]);

        if (result.affectedRows === 0) return res.status(404).send({ message: "Button not found" });

        res.status(204).end();
    } catch (err) {
        console.error("Error deleting button:", err);
        res.status(500).json({ error: "Failed to delete button" });
    }
});


app.put("/button/:id", async (req, res) => {
    const { id } = req.params;
    const { upvotes } = req.body;


	//it may make more sense to rewrite this to increment
	//or decrement but for now I will leave it 
    if (!id || upvotes === undefined) {
        return res.status(400).send({ message: "Invalid data" });
    }

    const query = "UPDATE button SET upvotes = ? WHERE id = ?";

    const connection = await sql.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(query, [upvotes, id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).send({ message: "Button not found" });
        }

        await connection.commit();
        res.status(204).end();  // No content but request is successful
    } catch (err) {
        await connection.rollback();
        console.log(err);
        res.status(500).json({ error: "Failed to update button" });
    } finally {
        connection.release();
    }
});




app.use(express.static("files"));

app.listen(PORT);
console.log("up and running");
