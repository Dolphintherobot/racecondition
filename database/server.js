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

const db = con.promise();


const createTable = "create table if not exists posts (id integer primary key auto_increment, topic text NOT NULL,data text NOT NULL, date TIMESTAMP DEFAULT NOW())"

const createTable2 = "create table if not exists responses (id integer primary key auto_increment,data text NOT NULL, postId integer, date TIMESTAMP DEFAULT NOW())"


db.query(createTable).catch(err => console.log(err));
db.query(createTable2).catch(err => console.log(err));


//try connecting to the couchdb database
const COUCHDB_URL = process.env.COUCHDB_URL || 'http://admin:password@localhost:5984';
const COUCHDB_DB = process.env.COUCHDB_DB || 'questionsdb';

const nano = require('nano')(COUCHDB_URL)
nano.auth("admin","password");

try{
const db = nano.use(COUCHDB_DB);
	}
catch (err) {

	console.log(err);
	nano.create(COUCHDB_DB);
	db = nano.use(COUCHDB_DB);

}
const db = nano.use(COUCHDB_DB);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(express.json());
app.use(cors());

app.get('/', (req,res) => {

	res.sendFile(path.join(__dirname, '/posting.html'));


})


//uses AJAX so slightly different format 
app.post("/postmessage",async  (req,res) => { 

	var topic = req.body.topic;
	var data  = req.body.data;
	
	let postObject = {
		id:postId++,
		topic:topic,
		data:data,
		timestamp: new Date(),
	};

	//posts.push(postObject);
	//

	let respObj = await insertPost(topic,data);

	res.send(respObj);

});




//uses AJAX so slightly different format 
app.post("/postresponse", async (req,res) => { 

	var postId = req.body.postId;
	var data  = req.body.data;
	
	let responseObject = {
		id:responseId++,
		postId:postId,
		data:data,
		timestamp:new Date(),
	};

	//responses.push(responseObject);

	let respObj = await insertResponse(postId,data);

	res.send(respObj);

});




app.get("/alldata",async (req,res) => {

	let alldata = await getAllData();

	res.json(alldata);



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
