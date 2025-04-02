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
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    author VARCHAR(255),
    channelId INT,
    photoId INT,
    FOREIGN KEY (channelId) REFERENCES channel(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS photos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    photo MEDIUMBLOB NOT NULL
);

CREATE TABLE IF NOT EXISTS reply (
    id INT PRIMARY KEY AUTO_INCREMENT,
    topic VARCHAR(255) NOT NULL,
    description TEXT,
    post_id INT,
    reply_id INT,  -- reference to reply(id) for nested replies
    photo_id INT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    author VARCHAR(255)
);


CREATE TABLE IF NOT EXISTS button (
    id INT PRIMARY KEY AUTO_INCREMENT,
    upvotes INT DEFAULT 0,
    post_id INT,
    FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
    id INT PRIMARY KEY AUTO_INCREMENT, 
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    isAdmin INT,
    photo_id INT,
    FOREIGN KEY (photo_id) REFERENCES photos(id)
);

CREATE TABLE IF NOT EXISTS replyButton (
    id INT PRIMARY KEY AUTO_INCREMENT,
    upvotes INT DEFAULT 0,
    reply_id INT,
    FOREIGN KEY (reply_id) REFERENCES reply(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profile (
    id INT PRIMARY KEY AUTO_INCREMENT,
    upvotes INT DEFAULT 0,
    account_id INT,
    photo_id INT,
    job_title TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    interests TEXT,
    education TEXT,
    FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE
);




`

const multer = require('multer');



//try grabbing the tables for sql 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(express.json());
app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });




//just fires up some basic sql queries in order
async function setUp() {

await sql.query(createTablesQuery).catch(err => console.log("error with database" + err));
await sql.query("INSERT INTO photos (photo) VALUES (?)",[1]).catch(err => console.log(err));
await sql.query("INSERT INTO account (username,password,isAdmin,photo_id) VALUES (?,?,?,?)",["admin","password",1,1]).catch(err => console.log(err));


}


setUp();


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

app.get("/channelData/:id", async (req, res) => {
    const { id } = req.params;

    if (!id) return res.status(400).send({ message: "No channel ID provided" });

    // Query to return posts, replies, buttons, and associated photos
    const query = `
        SELECT 
            p.id AS postId, 
            p.topic AS postTopic,
            p.description AS postDescription,
            p.date AS postDate,
            p.channelId,
            p.author AS postAuthor,
            postPhoto.photo AS postPhoto,  -- Select post photo
            r.id AS replyId,
            r.topic AS replyTopic,
            r.description AS replyDescription,
            r.date AS replyDate,
            r.author AS replyAuthor,
            replyPhoto.photo AS replyPhoto,  -- Select reply photo
            b.id AS buttonId,
            b.upvotes,
            b.post_id,
            acc.id AS accountId,  -- Select account ID
            acc.username AS accountUsername,  -- Select account username
            accountPhoto.photo AS accountPhoto  -- Select account photo
        FROM post AS p
        LEFT JOIN reply AS r ON p.id = r.post_id
        LEFT JOIN button AS b ON p.id = b.post_id
        LEFT JOIN photos AS postPhoto ON p.photoId = postPhoto.id  -- Join to get post photo
        LEFT JOIN photos AS replyPhoto ON r.photo_id = replyPhoto.id  -- Join to get reply photo
        LEFT JOIN account AS acc ON p.author = acc.username  -- Join to get account details
        LEFT JOIN photos AS accountPhoto ON acc.photo_id = accountPhoto.id  -- Join to get account photo
        WHERE p.channelId = ?
        ORDER BY p.date;
    `;

    try {
        let [result] = await sql.execute(query, [id]);
        if (result.length === 0) {
            return res.status(404).send({ message: "No data found" });
        }

        res.status(200).json({ result });
    } catch (error) {
        console.error("Error executing query:", error);
        res.status(500).send({ message: "Internal server error" });
    }
});

app.post("/channel",async  (req,res) => { 

	let title = req.body.title;
	let description  = req.body.description;
	let username = req.body.username;
	let photo = req.body.photo;
	let response = {channelId:0,postId:0,title:title,description:description}

	let channelQuery = "INSERT INTO channel (title,description) VALUES (?,?)"
	let postQuery = "INSERT INTO post (topic,description,channelId,author) VALUES (?,?,?,?)"


	let r = await sql.query(channelQuery,[title,description])
	r = r[0]
	response.channelId = r.insertId
	let result = await createPost(title,description,response.channelId,username,photo);
	response.postId = result.postId;
	response.postButtonId = result.postButtonId;
	response.title = title;
	response.description = description;
	res.status(201).json(response);	
	
});



app.post("/channel/search", async (req,res) => {

	const { query } = req.body;


	let q = "SELECT * FROM channel WHERE title LIKE CONCAT('%',?,'%') OR description LIKE CONCAT('%',?,'%')"

	sql.query(q,[query,query]).
		then(d =>  {
		
			let [data] = d;

			res.send({channels:data});
		}).
		catch(err => {console.log(err)

			res.status(500).send("Internal server error");
		}) ;

	

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


app.post("/post", upload.single("photo"), async (req, res) => {
    const { topic, description, channelId, author } = req.body;
    const photo = req.file;  // The uploaded file (photo)

    if (!topic || !description || !channelId || !author) {
        return res.status(400).send({ message: "Missing required fields" });
    }

    try {

	    result = await createPost(topic,description,channelId,author,photo);

	    res.status(200).send(result);
        } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).send({ message: "Error creating post" });
    }
});

app.put("/post/:id", upload.single("photo"), async (req, res) => {
    const { id } = req.params;
    const { topic, description, author } = req.body;
    const photo = req.file;  // The uploaded file (photo)

    if (!topic && !description && !author && !photo) {
        return res.status(400).send({ message: "Nothing to update" });
    }

    try {
        let photoId = null;
        if (photo) {
            // Insert the new photo into the photos table
            const buffer = photo.buffer;
            const [photoResult] = await sql.execute("INSERT INTO photos (photo) VALUES (?)", [buffer]);
            photoId = photoResult.insertId;
        }

        // Update the post with new values
        const [updateResult] = await sql.execute(
            "UPDATE post SET topic = ?, description = ?, author = ?, photoId = ? WHERE id = ?",
            [topic, description, author, photoId, id]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).send({ message: "Post not found" });
        }

        res.status(200).json({ message: "Post updated successfully" });
    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).send({ message: "Error updating post" });
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





async function createPost(topic,description,channelId,author,photo) {

    if (!topic || !description || !channelId || !author) {
        return res.status(400).send({ message: "Missing required fields" });
    }

    try {
        let photoId = null;
        if (photo) {
            // Convert the photo file to a buffer (for MySQL storage)
            const buffer = photo.buffer;
            const [photoResult] = await sql.execute("INSERT INTO photos (photo) VALUES (?)", [buffer]);
            photoId = photoResult.insertId;
        }

        // Insert post into the post table
        const [postResult] = await sql.execute(
            "INSERT INTO post (topic, description, channelId, author, photoId) VALUES (?, ?, ?, ?, ?)",
            [topic, description, channelId, author, photoId]
        );

	const [postButton] = await sql.execute(
		"INSERT INTO button (post_id) VALUES (?)",[postResult.insertId]);
       return  {
            message: "Post created successfully",
            postId: postResult.insertId,
	    postButtonId:postButton.insertId,
        }

    }
	catch (err) {

		console.log("error creating post" + err);
		return {
			message:"Error in creating post" + err,
		}

	}



}
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


app.get("/nestedReply/:id", async (req, res) => {
    const { id } = req.params;

    if (!id) return res.status(400).send({ message: "No reply ID provided" });

    const query = "SELECT * FROM reply WHERE reply_id = ?";

    try {
        const [reply] = await sql.query(query, [id]);
       	res.send({ reply: reply });
    } catch (err) {
        console.error("Error fetching reply:", err);
        res.status(500).json({ error: "Failed to fetch reply" });
    }
});





// POST /reply
app.post("/reply", upload.single("photo"), async (req, res) => {
    const { topic, description, postId, author,reply_id } = req.body;
    const photo = req.file;  // The uploaded file (photo)

    if (!topic || !description || (postId == null && reply_id == null) || !author) {
  
	    console.log(postId);
	    console.log(reply_id);
	    console.log("Missing field");
	    return res.status(400).send({ message: "Missing required fields" });
    }

    try {
        let photoId = null;
        if (photo) {
            // Convert the photo file to a buffer (for MySQL storage)
            const buffer = photo.buffer;
            const [photoResult] = await sql.execute("INSERT INTO photos (photo) VALUES (?)", [buffer]);
            photoId = photoResult.insertId;
        }

        // Insert reply into the reply table
        const [replyResult] = await sql.execute(
            "INSERT INTO reply (topic, description, post_id, author, photo_id,reply_id) VALUES (?, ?, ?, ?, ?,?)",
            [topic, description, postId, author, photoId,reply_id]
        );

	    const [replyButton] = await sql.execute(
		    "INSERT INTO replyButton  (reply_id) VALUES (?)",[replyResult.insertId]);
        res.status(201).json({
            message: "Reply created successfully",
            replyId: replyResult.insertId,
	    buttonId: replyButton.insertId,
        });
    } catch (error) {
        console.error("Error creating reply:", error);
        res.status(500).send({ message: "Error creating reply" });
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
            console.log("Invalid message");
	    return res.status(400).send({ message: "Invalid data" });
    }

	    //console.log(id);
	    //console.log(upvotes);
    const query = "UPDATE button SET upvotes = ? WHERE id = ?";

    const connection = await sql.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(query, [upvotes, id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
	    console.log("Button not found");
            return res.status(404).send({ message: "Button not found" });
        }

        await connection.commit();
	//console.log("SUCCESS");
        res.status(204).end();  // No content but request is successful
    } catch (err) {
        await connection.rollback();
        console.log(err);
        res.status(500).json({ error: "Failed to update button" });
    } finally {
        connection.release();
    }
});


/*########################### ACCOUNT CRUD/STUFF ########################*/




// CREATE - Add a new account
app.post('/account', async (req, res) => {
    const { username, password, isAdmin, photo_id } = req.body;

	//NOTE photos IS NOT PROGRAMMED IN HERE WOULD NEED A PLAN FOR THAT 
    try {
        const [result] = await sql.execute(
            'INSERT INTO account (username, password, isAdmin,photo_id) VALUES (?, ?, ?,?)',
            [username, password, isAdmin,photo_id]
        );
	createProfile(result.insertId,null);
        res.status(201).json({ id: result.insertId, username, password, isAdmin});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});



//check if an account creditionals match the database
app.post('/account/verify', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [result] = await sql.execute(
            'SELECT * FROM account WHERE username = ? AND password = ?',
            [username, password]
        );
	if (result.length  >0 ) {
		res.status(200).json({ id: result[0].id, username:username, password:password, isAdmin:result[0].isAdmin,});
	}
	else {
		res.status(404).send("Invalid credentails, account not found")
	}

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});






// READ - Get all accounts
app.get('/account', async (req, res) => {
    try {
        const [rows] = await sql.execute('SELECT * FROM account');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// READ - Get a specific account by id
app.get('/account/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await sql.execute('SELECT * FROM account WHERE id = ?', [id]);
        if (rows.length === 0) {
            res.status(404).send('Account not found');
        } else {
            res.json(rows[0]);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// UPDATE - Update an account's details
app.put('/account/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password, isAdmin, photo_id } = req.body;

    try {
        const [result] = await sql.execute(
            'UPDATE account SET username = ?, password = ?, isAdmin = ?, photo_id = ? WHERE id = ?',
            [username, password, isAdmin, photo_id, id]
        );

        if (result.affectedRows === 0) {
            res.status(404).send('Account not found');
        } else {
            res.status(200).send('Account updated successfully');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// DELETE - Delete an account
app.delete('/account/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await sql.execute('DELETE FROM account WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            res.status(404).send('Account not found');
        } else {
            res.status(200).send('Account deleted successfully');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

//##################### PHOTO CRUD ######################

app.post("/photo", upload.single("photo"), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: "No photo file uploaded" });
    }

    // Get the binary data from the uploaded photo
    const photoBuffer = req.file.buffer;

    // Insert the photo into the database
    const query = "INSERT INTO photos (photo) VALUES (?)";
    db.query(query, [photoBuffer], (err, result) => {
        if (err) {
            console.error("Error uploading photo:", err);
            return res.status(500).json({ error: "Failed to upload photo" });
        }
        res.status(201).json({ photoId: result.insertId, message: "Photo uploaded successfully" });
    });
});

// Read a photo by ID (GET /photo/:id)
app.get("/photo/:id", (req, res) => {
    const { id } = req.params;

    const query = "SELECT photo FROM photos WHERE id = ?";
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error("Error retrieving photo:", err);
            return res.status(500).json({ error: "Failed to retrieve photo" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "Photo not found" });
        }

        // Send the photo buffer as a response
        res.set("Content-Type", "image/jpeg");  // Adjust according to image type
        res.send(result[0].photo);
    });
});

// Update a photo by ID (PUT /photo/:id)
app.put("/photo/:id", upload.single("photo"), (req, res) => {
    const { id } = req.params;

    if (!req.file) {
        return res.status(400).send({ message: "No photo file uploaded" });
    }

    const photoBuffer = req.file.buffer;

    const query = "UPDATE photos SET photo = ? WHERE id = ?";
    db.query(query, [photoBuffer, id], (err, result) => {
        if (err) {
            console.error("Error updating photo:", err);
            return res.status(500).json({ error: "Failed to update photo" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Photo not found" });
        }

        res.status(200).json({ message: "Photo updated successfully" });
    });
});

// Delete a photo by ID (DELETE /photo/:id)
app.delete("/photo/:id", (req, res) => {
    const { id } = req.params;

    const query = "DELETE FROM photos WHERE id = ?";
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error("Error deleting photo:", err);
            return res.status(500).json({ error: "Failed to delete photo" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Photo not found" });
        }

        res.status(200).json({ message: "Photo deleted successfully" });
    });
});

// Create Reply Button
app.post('/replyButton', async (req, res) => {
    const { reply_id, upvotes } = req.body;
    try {
        const [result] = await sql.execute(
            'INSERT INTO replyButton (reply_id, upvotes) VALUES (?, ?)',
            [reply_id, upvotes]
        );
        res.status(201).json({ id: result.insertId, reply_id, upvotes });
    } catch (error) {
        console.error('Error creating reply button:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get all Reply Buttons
app.get('/replyButton', async (req, res) => {
    try {
        const [rows] = await sql.execute('SELECT * FROM replyButton');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching reply buttons:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get Reply Button by ID
app.get('/replyButton/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await sql.execute('SELECT * FROM replyButton WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Reply button not found' });
        }
        res.status(200).send({button:rows[0]});
    } catch (error) {
        console.error('Error fetching reply button:', error);
        res.status(500).json({ error: 'Database error' });
    }
});



// Get Reply Button by ID
app.get('/reply/replyButton/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await sql.execute('SELECT * FROM replyButton WHERE reply_id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Reply button not found' });
        }
        res.status(200).send({button:rows[0]});
    } catch (error) {
        console.error('Error fetching reply button:', error);
        res.status(500).json({ error: 'Database error' });
    }
});



// Update Reply Button with Transaction
app.put('/replyButton/:id', async (req, res) => {
    const { id } = req.params;
    const upvotes  = req.body.upvotes;

	if (upvotes ==undefined ) {
	
		res.status(404).json({message:"Upvotes parameter undefined"});

	}

    //console.log(id);
    //console.log(upvotes);
    // Start a transaction
    const connection = await sql.getConnection();


	try {
        await connection.beginTransaction();  // Start transaction

        // Update the replyButton with the specified ID
        const [result] = await connection.execute(
            'UPDATE replyButton SET upvotes = ? WHERE id = ?',
            [upvotes, id]
        );

        // If no rows were affected, the replyButton does not exist
        if (result.affectedRows === 0) {
            await connection.rollback();  // Rollback transaction if no rows were updated
            	console.log("id not found" + id);
		return res.status(404).json({ error: 'Reply button not found' });
        }

        // Commit the transaction if the update is successful
        await connection.commit();
	//console.log("SUCCESS");

        res.status(200).json({ message: 'Reply button updated', upvotes });
    } catch (error) {
        // Rollback the transaction in case of an error
        await connection.rollback();
        console.error('Error updating reply button:', error);
        res.status(500).json({ error: 'Database error' });
    } finally {
        connection.release();  // Always release the connection
    }
});


// Delete Reply Button
app.delete('/replyButton/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await sql.execute('DELETE FROM replyButton WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Reply button not found' });
        }
        res.status(200).json({ message: 'Reply button deleted' });
    } catch (error) {
        console.error('Error deleting reply button:', error);
        res.status(500).json({ error: 'Database error' });
    }
});


//######################## Profile stuff 
async function createProfile(accountId,photo) {
        
	try {
		let photoId = null;
        	if (photo) {
            	// Convert the photo file to a buffer (for MySQL storage)
            	const buffer = photo.buffer;
            	const [photoResult] = await sql.execute("INSERT INTO photos (photo) VALUES (?)", [buffer]);
            	photoId = photoResult.insertId;
        	}

	const [result] = await sql.execute(
            'INSERT INTO profile (acount_id,photo_id) VALUES (?,?)',
            [accountId,photoId]
        );
	}

	catch (err) {
		console.log(err);
	}
	return result.insertId;
}

async function getProfile(id) {

	let query = ""
	

	if (id) {
		query =`
		SELECT * FROM profile as p
		INNER JOIN accounts ON accounts.id = p.account_id
	 	WHERE p.account_id = ?
		`

		let [rows] = await sql.execute(query, [id]);

	}
	else {
		query = `
	 SELECT * FROM profile as p
	 INNER JOIN accounts ON accounts.id = p.account_id
	 `
		let [rows] = await sql.execute(query, [id]);
	}


	return rows;

}



app.get('/profile/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const rows = getProfile(id);
        if (rows.length === 0) {
            return res.status(404).json({ error: "profile not found" });
        }
        res.status(200).send({profile:rows[0]});
    } catch (error) {
        console.error('Error profile:', error);
        res.status(500).json({ error: 'Database error' });
    }
});


app.get('/profile', async (req, res) => {
    try {
	 const q = `
	 SELECT * FROM profile as p
	 INNER JOIN accounts ON accounts.id = p.account_id
	 `
        const rows = getProfile(null);
        if (rows.length === 0) {
            return res.status(404).json({ error: "profile not found" });
        }
        res.status(200).send({profile:rows});
    } catch (error) {
        console.error('Error profile:', error);
        res.status(500).json({ error: 'Database error' });
    }
});


app.get('/profile/search/:query', async (req, res) => {
    
	const {query} = req.params;
	try {
	 const q = `
	 SELECT * FROM profile as p
	 INNER JOIN accounts ON accounts.id = p.account_id
	 WHERE username LIKE CONCAT('%',?,'%')"
	 `
        const [rows] = await sql.execute(q,[query]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "profile not found" });
        }
        res.status(200).send({profile:rows});
    } catch (error) {
        console.error('Error profile:', error);
        res.status(500).json({ error: 'Database error' });
    }
});




app.get('/profile/score/:author', async (req, res) => {
    

	const {author} = req.params;

	try {
        const result = await computeUpvotes(author);
        if (result === -1) {
            return res.status(404).json({ error: "profile not found" });
        }
        res.status(200).send({upvotes:result});
    } catch (error) {
        console.error('Error profile:', error);
        res.status(500).json({ error: 'Database error' });
    }
});




async function computeUpvotes(author) {

const q1 = 
`
    SELECT
      p.id as post_id,
      p.author as postAuthor,
      b.upvotes as postUpvotes,
      SUM(b.upvotes) as total
      FROM post as p
      JOIN button as b ON b.post_id = p.id
      WHERE p.author = ?
      GROUP BY p.id,p.author,b.upvotes
`


const q2 = 
`
    SELECT
      r.id as reply_id,
      r.author as replyAuthor,
      rb.upvotes as replyUpvotes,
      SUM(rb.upvotes) as total
      FROM reply as r
      JOIN replyButton as rb ON rb.reply_id = r.id
      WHERE r.author = ?
      GROUP BY r.id,r.author,rb.upvotes
`



	//const [result] =  await sql.execute(query,[author]);

	const [postResult] = await sql.execute(q1,[author])
	const [replyResult] = await sql.execute(q2,[author])

	console.log(postResult)
	//console.log(replyResult[0].total)

	let total = 0
	postResult.forEach( e => {
	
		total = total + parseInt(e.total)
	})

	replyResut.forEach( e => {
		total = total + parseInt(e.total)
	})


	if (postResult.length === 0 && replyResult.length === 0) {
		return -1;
	}


	return total
	//return parseInt(postResult[0].total) + parseInt(replyResult[0].total)

}



app.use(express.static("files"));

app.listen(PORT);
console.log("up and running");
