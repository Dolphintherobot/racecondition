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
    photo VARCHAR(255),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    author VARCHAR(255),
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
    author VARCHAR(255),
    FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_id) REFERENCES reply(id) ON DELETE CASCADE
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




`


//try grabbing the tables for sql 
sql.query(createTablesQuery).catch(err => console.log("error with database" + err));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(express.json());
app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//dummy query for the photos table for now, to satisfy contrasints 


sql.query("INSERT INTO photos (photo) VALUES (?)",[1]).catch(err => console.log(err));
sql.query("INSERT INTO account (username,password,isAdmin,photo_id) VALUES (?,?,?,?)",["admin","password",1,1]).catch(err => console.log(err));

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


app.get("/channelData/:id", async (req,res) => {
    const { id } = req.params;

    if (!id) return res.status(400).send({ message: "No channel ID provided" });


	//TODO modify this query to return the accounts as well 
	//the alias need to be changed
	const query =`
SELECT 
p.id as postId, p.topic as postTopic,p.description as postDescription,
p.date as postDate,p.channelId,p.author as postAuthor,
r.id as replyId ,r.topic as replyTopic,r.description as replyDescription,
r.date as replyDate, r.author as replyAuthor,
b.id as buttonId,b.upvotes,b.post_id
FROM post AS p 
LEFT JOIN reply AS r ON  p.id = r.post_id
LEFT JOIN button AS b ON p.id = b.post_id
WHERE p.channelId = ?
ORDER BY p.date;
`
	let [result] = await sql.execute(query,[id]);
	if (result.length == 0) {	
            return res.status(404).send({ message: "No data found" });
	}

	res.status(200).json({result});
	
 


})


app.post("/channel",async  (req,res) => { 

	let title = req.body.title;
	let description  = req.body.description;
	let username = req.body.username;
	let responseObject = {channelId:0,postId:0,title:title,description:description}

	let channelQuery = "INSERT INTO channel (title,description) VALUES (?,?)"
	let postQuery = "INSERT INTO post (topic,description,channelId,author) VALUES (?,?,?,?)"

	sql.query(channelQuery,[title,description]).
		then( r => {
		let [response] = r;	
		responseObject.channelId = response.insertId

		sql.query(postQuery,[title,description,responseObject.channelId,username]).
			then( d =>{
				let [data] = d;
				responseObject.postId = data.insertId;

				res.send(responseObject);
				})
		

			})


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



app.post("/post", async (req, res) => {
    const { topic, description, channelId, photo,author } = req.body;
    const query = "INSERT INTO post (topic, description, photo, channelId,author) VALUES (?, ?, ?, ?,?)";

    const connection = await sql.getConnection();
    const [result] = await connection.query(query, [topic, description, photo, channelId,author]);
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
app.post("/reply", async (req, res) => {
    const { topic, description, post_id, reply_id,author } = req.body;
    const query = "INSERT INTO reply (topic, description, post_id, reply_id,author) VALUES (?, ?, ?, ?, ?)";

    try {
        const [result] = await sql.query(query, [topic, description, post_id, reply_id,author]);
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




app.use(express.static("files"));

app.listen(PORT);
console.log("up and running");
