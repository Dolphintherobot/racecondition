'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const db = require('./database');

const app = express();
const PORT = 8080;

db.setUp().catch(err => {
    console.error('Database setup failed:', err);
    process.exit(1);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(express.json());
app.use(cors());
app.use(express.static("files"));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/posting.html'));
});

app.get("/channel", async (req, res) => {
    try {
        const data = await db.getChannels();
        res.send({ channels: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch channels" });
    }
});

app.get("/channel/:id", async (req, res) => {
    try {
        const channel = await db.getChannelById(req.params.id);
        if (!channel) return res.status(404).send({ message: "Channel not found" });
        res.send({ channel });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch channel" });
    }
});

app.get("/channelData/:id", async (req, res) => {
    try {
        const result = await db.getChannelData(req.params.id);
        if (result.length === 0) return res.status(404).send({ message: "No data found" });
        res.status(200).json({ result });
    } catch (error) {
        console.error("Error fetching channel data:", error);
        res.status(500).send({ message: "Internal server error" });
    }
});

app.post("/channel", upload.single("photo"), async (req, res) => {
    try {
        const { title, description, username } = req.body;
        const response = {
            channelId: 0,
            postId: 0,
            title,
            description
        };

        const channelId = await db.createChannel(title, description);
        const postResult = await db.createPostWithPhoto(
            title,
            description,
            channelId,
            username,
            req.file?.buffer
        );

        response.channelId = channelId;
        response.postId = postResult.postId;
        response.postButtonId = postResult.postButtonId;
        res.status(201).json(response);
    } catch (error) {
        console.error("Error creating channel:", error);
        res.status(500).send({ message: "Error creating channel" });
    }
});

app.post("/channel/search", async (req, res) => {
    try {
        const data = await db.searchChannels(req.body.query);
        res.send({ channels: data });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
});

app.put("/channel/:id", async (req, res) => {
    try {
        const affectedRows = await db.updateChannel(
            req.params.id,
            req.body.title,
            req.body.description
        );
        
        if (affectedRows === 0) return res.status(404).send({ message: "Channel not found" });
        res.status(204).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

app.delete("/channel/:id", async (req, res) => {
    try {
        const affectedRows = await db.deleteChannel(req.params.id);
        if (affectedRows === 0) return res.status(404).send({ message: "Channel not found" });
        res.status(204).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

app.get("/post", async (req, res) => {
    try {
        const posts = await db.getPosts();
        res.send({ posts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch posts" });
    }
});

app.get("/post/:id", async (req, res) => {
    try {
        const post = await db.getPostById(req.params.id);
        if (!post) return res.status(404).send({ message: "Post not found" });
        res.send({ post });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch post" });
    }
});

app.post("/post", upload.single("photo"), async (req, res) => {
    try {
        const { topic, description, channelId, author } = req.body;
        const result = await db.createPostWithPhoto(
            topic,
            description,
            channelId,
            author,
            req.file?.buffer
        );
        res.status(200).send(result);
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).send({ message: "Error creating post" });
    }
});

app.put("/post/:id", upload.single("photo"), async (req, res) => {
    try {
        let photoId = null;
        if (req.file) {
            const photoResult = await db.createPhoto(req.file.buffer);
            photoId = photoResult.insertId;
        }

        const affectedRows = await db.updatePost(
            req.params.id,
            req.body.topic,
            req.body.description,
            req.body.author,
            photoId
        );

        if (affectedRows === 0) return res.status(404).send({ message: "Post not found" });
        res.status(200).json({ message: "Post updated successfully" });
    } catch (error) {
        console.error("Error updating post:", error);
        res.status(500).send({ message: "Error updating post" });
    }
});

app.delete("/post/:id", async (req, res) => {
    try {
        const affectedRows = await db.deletePost(req.params.id);
        if (affectedRows === 0) return res.status(404).send({ message: "Post not found" });
        res.status(204).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete post" });
    }
});

app.get("/reply", async (req, res) => {
    try {
        const replies = await db.getReplies();
        res.send({ replies });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch replies" });
    }
});

app.get("/reply/:id", async (req, res) => {
    try {
        const reply = await db.getReplyById(req.params.id);
        if (!reply) return res.status(404).send({ message: "Reply not found" });
        res.send({ reply });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch reply" });
    }
});

app.get("/nestedReply/:id", async (req, res) => {
    try {
        const replies = await db.getNestedReplies(req.params.id);
        res.send({ reply: replies });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch nested replies" });
    }
});

app.post("/reply", upload.single("photo"), async (req, res) => {
    try {
        const result = await db.createReplyWithPhoto(
            req.body.topic,
            req.body.description,
            req.body.postId,
            req.body.author,
            req.body.reply_id,
            req.file?.buffer
        );
        
        res.status(201).json({
            message: "Reply created successfully",
            replyId: result.replyId,
            buttonId: result.buttonId,
        });
    } catch (error) {
        console.error("Error creating reply:", error);
        res.status(500).send({ message: "Error creating reply" });
    }
});

app.delete("/reply/:id", async (req, res) => {
    try {
        const affectedRows = await db.deleteReply(req.params.id);
        if (affectedRows === 0) return res.status(404).send({ message: "Reply not found" });
        res.status(204).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete reply" });
    }
});

app.put("/reply/:id", async (req, res) => {
    try {
        const affectedRows = await db.updateReply(
            req.params.id,
            req.body.topic,
            req.body.description
        );
        
        if (affectedRows === 0) return res.status(404).send({ message: "Reply not found" });
        res.status(204).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update reply" });
    }
});

app.get("/button", async (req, res) => {
    try {
        const buttons = await db.getButtons();
        res.send({ buttons });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch buttons" });
    }
});

app.get("/button/:id", async (req, res) => {
    try {
        const button = await db.getButtonById(req.params.id);
        if (!button) return res.status(404).send({ message: "Button not found" });
        res.send({ button });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch button" });
    }
});

app.post("/button", async (req, res) => {
    try {
        const buttonId = await db.createButton(req.body.upvotes, req.body.post_id);
        res.status(201).send({ buttonId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create button" });
    }
});

app.delete("/button/:id", async (req, res) => {
    try {
        const affectedRows = await db.deleteButton(req.params.id);
        if (affectedRows === 0) return res.status(404).send({ message: "Button not found" });
        res.status(204).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete button" });
    }
});

app.put("/button/:id", async (req, res) => {
   

	const id =  req.params.id;
      const {account_id,action,type} = req.body;

	if (!action || !account_id || !type) {
	
		return res.status(404).send({message:"Invalid request, specifiy an action,button type and an account id"});
	}


	if (!id) {
	
		return res.status(404).send({message:"Null id was passed in"});

	}

	const up = action === "up";
	const down = !up;
      try {
       
	const logs = await db.checkLogs(id,account_id);
	 const empty = logs.length === 0
	if (empty ){ logs = await db.createLogs(id,account_id,up,!up,type); }
	
	const legal =  empty ||( ((logs.hasUpvoted != up ||  !logs.hasUpvoted)
		&& (logs.hasDownvoted != down || !logs.hasDownvoted) ));

	if (!legal) {
	
		res.status(403).send({message:" cannot update button username has already persformed the action",logs})

	}
	const affectedRows = await db.updateButton(req.params.id, req.body.upvotes);
        if (affectedRows === 0) return res.status(404).send({ message: "Button not found" });
        res.status(204).send({logs});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update button" });
    }
});

app.post('/account', async (req, res) => {
    try {
        const accountId = await db.createAccount(
            req.body.username,
            req.body.password,
            req.body.isAdmin,
            req.body.photo_id
        );
        await db.createProfile(accountId, null);
        res.status(201).json({ id: accountId });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/account/verify', async (req, res) => {
    try {
        const account = await db.verifyAccount(req.body.username, req.body.password);
        if (!account) return res.status(404).send("Invalid credentials");
        res.status(200).json(account);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/account', async (req, res) => {
    try {
        const accounts = await db.getAccounts();
        res.json(accounts);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/account/:id', async (req, res) => {
    try {
        const account = await db.getAccountById(req.params.id);
        if (!account) return res.status(404).send('Account not found');
        res.json(account);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.put('/account/:id', async (req, res) => {
    try {
        const affectedRows = await db.updateAccount(
            req.params.id,
            req.body.username,
            req.body.password,
            req.body.isAdmin,
            req.body.photo_id
        );
        
        if (affectedRows === 0) return res.status(404).send('Account not found');
        res.status(200).send('Account updated successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.delete('/account/:id', async (req, res) => {
    try {
        const affectedRows = await db.deleteAccount(req.params.id);
        if (affectedRows === 0) return res.status(404).send('Account not found');
        res.status(200).send('Account deleted successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.post("/photo", upload.single("photo"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send({ message: "No photo uploaded" });
        const photoId = await db.createPhoto(req.file.buffer);
        res.status(201).json({ photoId, message: "Photo uploaded successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to upload photo" });
    }
});

app.get("/photo/:id", async (req, res) => {
    try {
        const photo = await db.getPhotoById(req.params.id);
        if (!photo) return res.status(404).json({ message: "Photo not found" });
        res.set("Content-Type", "image/jpeg").send(photo);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to retrieve photo" });
    }
});

app.put("/photo/:id", upload.single("photo"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send({ message: "No photo uploaded" });
        const affectedRows = await db.updatePhoto(req.params.id, req.file.buffer);
        if (affectedRows === 0) return res.status(404).send({ message: "Photo not found" });
        res.status(200).json({ message: "Photo updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update photo" });
    }
});

app.delete("/photo/:id", async (req, res) => {
    try {
        const affectedRows = await db.deletePhoto(req.params.id);
        if (affectedRows === 0) return res.status(404).send({ message: "Photo not found" });
        res.status(200).json({ message: "Photo deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete photo" });
    }
});

app.get('/profile/:id', async (req, res) => {
    try {
        const profile = await db.getProfile(req.params.id);
        if (profile.length === 0) return res.status(404).json({ error: "Profile not found" });
        res.status(200).send({ profile: profile[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/profile', async (req, res) => {
    try {
        const profiles = await db.getProfile();
        res.status(200).send({ profiles });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/profile/search', async (req, res) => {
    try {
        const results = await db.searchProfiles(req.body.query);
        res.status(200).send({ profiles: results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/profile/score/:author', async (req, res) => {
    try {
        const score = await db.computeUpvotes(req.params.author);
        if (score === -1) return res.status(404).json({ error: "Profile not found" });
        res.status(200).send({ upvotes: score });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.put("/profile/:id", upload.single("photo"), async (req, res) => {
    try {
        const affectedRows = await db.updateProfile(
            req.params.id,
            req.body.job_title,
            req.body.interests,
            req.body.education,
            req.file?.buffer
        );
        
        if (affectedRows === 0) return res.status(404).json({ error: "Profile not found" });
        res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
