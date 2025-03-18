'use strict';



const cors = require("cors");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const sql = require("mysql2");

const PORT = 8080;
const DOCKER_IP = "172.23.0.2";  // You may not need this anymore


//try connecting to sql database
const con = sql.createPool({
    host: DOCKER_IP || process.env.DB_HOST || "mysql1",  // Use the Docker service name
    port: process.env.DB_PORT || "3306",  // Use the correct MySQL port
    user: process.env.DB_USER || "user1",
    password: process.env.DB_PASSWORD || "user1_xxx",
    database: process.env.DB_DATABASE || "my_database",
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
const COUCHDB_URL = process.env.COUCHDB_URL || 'http://admin:password@localhost:5984';
const COUCHDB_DB = process.env.COUCHDB_DB || 'questionsdb';

const nano = require('nano')(COUCHDB_URL)
nano.auth("admin","password");



const createTablesQuery = `
  CREATE TABLE IF NOT EXISTS channel (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  );

  CREATE TABLE IF NOT EXISTS post (
      id INT PRIMARY KEY AUTO_INCREMENT,
      topic VARCHAR(255) NOT NULL,
      description TEXT,
      photo VARCHAR(255),
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (channelId) REFERENCES channel(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_post_photo ON post(photo);

  CREATE TABLE IF NOT EXISTS photos (
      id INT PRIMARY KEY AUTO_INCREMENT,
      photo VARBINARY(MAX) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reply (
      id INT PRIMARY KEY AUTO_INCREMENT,
      topic VARCHAR(255) NOT NULL,
      description TEXT,
      post_id INT,
      reply_id INT,
      date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
      FOREIGN KEY (reply_id) REFERENCES reply(id) ON DELETE CASCADE,
  );

  CREATE INDEX IF NOT EXISTS idx_reply_post_id ON reply(post_id);

  CREATE TABLE IF NOT EXISTS button (
      id INT PRIMARY KEY AUTO_INCREMENT,
      upvotes INT DEFAULT 0,
      post_id INT,
      FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_button_post_id ON button(post_id);
`;




//try grabbing the tables for sql 
sql.query(createTablesQuery).catch(err => console.log(err));

try{
const couch = nano.use(COUCHDB_DB);
	}
catch (err) {

	console.log(err);
	nano.create(COUCHDB_DB);
	db = nano.use(COUCHDB_DB);

}
const couch = nano.use(COUCHDB_DB);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(express.json());
app.use(cors());

app.get('/', (req,res) => {

	res.sendFile(path.join(__dirname, '/posting.html'));


})



/*all the lovely stuff to do with channels*/

app.get("/channel" async (req,res) => {

	let query = "SELECT * FROM channels"

	sql.query(query).then([data] res.send({channels:data}).
		catch(err => console.log(err)) ;

	

});



app.post("/channel",async  (req,res) => { 

	let title = req.body.title;
	let description  = req.body.description;
	
	let postObject = {
		topic:topic,
		data:data,
	};

	let responseObject = {channelId:0,postId:0,title:title,description,description}

	let channelQuery = "INSERT INTO channel (title,description) VALUES (?,?)"
	let postQuery = "INSERT INTO post (topic,description,channelId) VALUES (?,?,?)"

	sql.query(channelQuery,[title,description]).
		then( [response] => {
		)
		responseObject[channelId] = response.insertId

		sql.query)(postQuery,[title,description,responseObject.channelId).
			then( [data] =>{

			)	responseObject[postId] = data.insertId;

				res.send(responseObject);
			)	})
		

		)	})


}));



app.post("/channel",async (req,res) => {

	/*data has be be in the format
	 * id -> id you wish to update
	 * topic --> topic you wish to update 
	 * description you wish to update
	 */


});




async function insertPost(topic,data) {

	let [resp] = await db.query("insert into posts (topic,data) VALUES (?,?)",[topic,data]).catch(err => console.log(err));
	return {sucess:true,id:resp.id};


}



async function insertResponse(postid,data) {

	let [resp] = await db.query("insert into responses (postId,data) VALUES (?,?)",[postid,data]).catch(err => console.log(err));;
	return {sucess:true,id:resp.insertId};


}



async function getAllData() {

	let [posts] = await db.query("select * from posts");
	let [responses] = await db.query("select * from responses");


	return {posts,responses};


}




app.use(express.static("files"));

app.listen(PORT);
console.log("up and running");
