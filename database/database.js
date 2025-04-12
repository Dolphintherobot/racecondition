'use strict';

const mysql = require("mysql2");
const files = require("./file");
const con = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || "3306",
    user: process.env.DB_USER || "user1",
    password: process.env.DB_PASSWORD || "user1_xxx",
    database: process.env.DB_DATABASE || "my_database",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    multipleStatements: true,
    typeCast: function castField( field, useDefaultTypeCasting ) {

        // We only want to cast bit fields that have a single-bit in them. If the field
        // has more than one bit, then we cannot assume it is supposed to be a Boolean.
        if ( ( field.type === "BIT" ) && ( field.length === 1 ) ) {

            var bytes = field.buffer();

            // A Buffer in Node represents a collection of 8-bit unsigned integers.
            // Therefore, our single "bit field" comes back as the bits '0000 0001',
            // which is equivalent to the number 1.
            return( bytes[ 0 ] === 1 );

        }

        return( useDefaultTypeCasting() );
    }


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
    name TEXT
);

CREATE TABLE IF NOT EXISTS reply (
    id INT PRIMARY KEY AUTO_INCREMENT,
    topic VARCHAR(255) NOT NULL,
    description TEXT,
    post_id INT,
    reply_id INT,
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

CREATE TABLE IF NOT EXISTS buttonLogs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_id INT,
    button_id INT,
    replyButton_id INT,
    hasUpvoted BIT,
    hasDownvoted BIT,
    FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
    FOREIGN KEY (button_id) REFERENCES button(id) ON DELETE CASCADE,
    FOREIGN KEY (replyButton_id) REFERENCES replyButton(id) ON DELETE CASCADE
);
   

`;

async function setUp() {
    await sql.query(createTablesQuery);
    await sql.query("INSERT INTO photos (name) VALUES (?)", ["a"]);
    await sql.query("INSERT INTO account (username,password,isAdmin,photo_id) VALUES (?,?,?,?)", 
                   ["admin","password",1,1]);
}

async function getChannels() {
    const [data] = await sql.query("SELECT * FROM channel");
    return data;
}

async function getChannelById(id) {
    const [channel] = await sql.query("SELECT * FROM channel WHERE id = ?", [id]);
    return channel[0];
}

async function searchChannels(query) {
    const [data] = await sql.query(
        "SELECT * FROM channel WHERE title LIKE CONCAT('%',?,'%') OR description LIKE CONCAT('%',?,'%')",
        [query, query]
    );
    return data;
}

async function createChannel(title, description) {
    const [result] = await sql.query("INSERT INTO channel (title,description) VALUES (?,?)", [title, description]);
    return result.insertId;
}

async function updateChannel(id, title, description) {
    const [result] = await sql.query("UPDATE channel SET title = ?, description = ? WHERE id = ?", [title, description, id]);
    return result.affectedRows;
}

async function deleteChannel(id) {
    // Get all posts belonging to this channel.
    const [posts] = await sql.execute("SELECT id FROM post WHERE channelId = ?", [id]);
    for (const post of posts) {
        await deletePost(post.id);
    }
    // Delete the channel record.
    const [result] = await sql.execute("DELETE FROM channel WHERE id = ?", [id]);
    return result.affectedRows;
}

async function getChannelData(id) {
    const [result] = await sql.execute(`
        SELECT 
            p.id AS postId, 
            p.topic AS postTopic,
            p.description AS postDescription,
            p.date AS postDate,
            p.channelId,
            p.author AS postAuthor,
            p.photoId as postPhotoId,
	    r.id AS replyId,
            r.topic AS replyTopic,
            r.description AS replyDescription,
            r.date AS replyDate,
            r.author AS replyAuthor,
	    r.photo_id as replyPhotoId,
            b.id AS buttonId,
            b.upvotes,
            b.post_id
        FROM post AS p
        LEFT JOIN reply AS r ON p.id = r.post_id
        LEFT JOIN button AS b ON p.id = b.post_id
        WHERE p.channelId = ?
        ORDER BY p.date`, [id]);
    return result;
}
async function createPostWithPhoto(topic, description, channelId, author, buffer) {
    const connection = await sql.getConnection();
    try {
        await connection.beginTransaction();
        let photoId = null;
        if (buffer) {
            photoId = await insertPhoto(buffer, connection);
        }
        const [postResult] = await connection.execute(
            "INSERT INTO post (topic, description, channelId, author, photoId) VALUES (?, ?, ?, ?, ?)",
            [topic, description, channelId, author, photoId]
        );
        const [postButton] = await connection.execute("INSERT INTO button (post_id) VALUES (?)", [postResult.insertId]);
        await connection.commit();
        return {
            postId: postResult.insertId,
            postButtonId: postButton.insertId
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}



async function getPosts() {
    const [posts] = await sql.query("SELECT * FROM post");
    return posts;
}

async function getPostById(id) {
    const [post] = await sql.query("SELECT * FROM post WHERE id = ?", [id]);
    return post[0];
}

async function updatePost(id, topic, description, author, photoId) {
    const [result] = await sql.execute(
        "UPDATE post SET topic = ?, description = ?, author = ?, photoId = ? WHERE id = ?",
        [topic, description, author, photoId, id]
    );
    return result.affectedRows;
}

async function deletePost(id) {
    // Get the post's photo id.
    const [post] = await sql.execute("SELECT photoId FROM post WHERE id = ?", [id]);
    const photoId = post[0]?.photoId;
    if (photoId) {
        await deletePhoto(photoId);
    }
    // Get all replies associated with this post.
    const [replies] = await sql.execute("SELECT id FROM reply WHERE post_id = ?", [id]);
    for (const reply of replies) {
        await deleteReply(reply.id);
    }
    // Delete the post record.
    const [result] = await sql.execute("DELETE FROM post WHERE id = ?", [id]);
    return result.affectedRows;
}

async function getReplies() {
    const [replies] = await sql.query("SELECT * FROM reply");
    return replies;
}

async function getReplyById(id) {
    const [reply] = await sql.query("SELECT * FROM reply WHERE id = ?", [id]);
    return reply[0];
}

async function getNestedReplies(id) {
    const [reply] = await sql.query("SELECT * FROM reply WHERE reply_id = ?", [id]);
    return reply;
}
async function createReplyWithPhoto(topic, description, postId, author, replyId, buffer) {
    const connection = await sql.getConnection();
    try {
        await connection.beginTransaction();
        let photoId = null;
        if (buffer) {
            photoId = await insertPhoto(buffer, connection);
        }
        const [replyResult] = await connection.execute(
            "INSERT INTO reply (topic, description, post_id, author, photo_id, reply_id) VALUES (?, ?, ?, ?, ?, ?)",
            [topic, description, postId, author, photoId, replyId]
        );
        const [replyButton] = await connection.execute("INSERT INTO replyButton (reply_id) VALUES (?)", [replyResult.insertId]);
        await connection.commit();
        return {
            replyId: replyResult.insertId,
            buttonId: replyButton.insertId
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function deleteReply(id) {
    // Retrieve the reply's associated photo id.
    const [reply] = await sql.execute("SELECT photo_id FROM reply WHERE id = ?", [id]);
    const photoId = reply[0]?.photo_id;
    if (photoId) {
        await deletePhoto(photoId);
    }
    // Delete the reply record.
    const [result] = await sql.execute("DELETE FROM reply WHERE id = ?", [id]);
    return result.affectedRows;
}



async function updateReply(id, topic, description) {
    const [result] = await sql.query("UPDATE reply SET topic = ?, description = ? WHERE id = ?", [topic, description, id]);
    return result.affectedRows;
}

async function getButtons() {
    const [buttons] = await sql.query("SELECT * FROM button");
    return buttons;
}

async function getButtonById(id) {
    const [button] = await sql.query("SELECT * FROM button WHERE id = ?", [id]);
    return button[0];
}

async function createButton(upvotes, post_id) {
    const [result] = await sql.query("INSERT INTO button (upvotes, post_id) VALUES (?, ?)", [upvotes, post_id]);
    return result.insertId;
}

async function deleteButton(id) {
    const [result] = await sql.query("DELETE FROM button WHERE id = ?", [id]);
    return result.affectedRows;
}


async function createLogs(button_id, account_id, upvote, downvote, type) {
    let query, params;

	try {
    if (type === "post") {
        query = "INSERT INTO buttonLogs (button_id, account_id, hasUpvoted, hasDownvoted, replyButton_id) VALUES (?, ?, ?, ?, ?)";
        params = [button_id, account_id, upvote, downvote, null]; 
    } else {
        query = "INSERT INTO buttonLogs (replyButton_id, account_id, hasUpvoted, hasDownvoted, button_id) VALUES (?, ?, ?, ?, ?)";
        params = [button_id, account_id, upvote, downvote, null];
    }

    const [result] = await sql.query(query, params);
    return result;
	}
	catch (err) {
		console.log(err);
		return undefined;
	}
}



async function checkLogs(button_id,account_id) {

	const query = "SELECT * FROM buttonLogs WHERE account_id = ? AND ( button_id = ? OR replyButton_id = ?)"
	const [result] = await sql.query(query,[account_id,button_id,button_id]);
	return result;

}




async function updateLogs(id,hasUpvoted,hasDownvoted) {

        const query = 'UPDATE buttonLogs SET hasUpvoted = ?, hasDownvoted = ? WHERE id = ?';
	const [result] = await sql.query(query,[hasUpvoted,hasDownvoted,id]);
	return result.affectedRows;

}





async function updateButton(id,increment) {
    
 	 if (!id || increment === undefined) {
            console.log("Invalid message");
	    return 0;
    }

    const query = increment == true ? "UPDATE button SET upvotes = upvotes + 1 WHERE id = ?": "UPDATE button SET upvotes = upvotes - 1 WHERE id = ?";

    const connection = await sql.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(query, [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
	    console.log("Button not found");
            return result.affectedRows;
        }

        await connection.commit();
	//console.log("SUCCESS");
	return result.affectedRows
    } catch (err) {
        await connection.rollback();
    	return 0;
    } finally {
        connection.release();
    }

}

async function createAccount(username, password, isAdmin, photo_id) {
    const [result] = await sql.execute(
        'INSERT INTO account (username, password, isAdmin, photo_id) VALUES (?, ?, ?, ?)',
        [username, password, isAdmin, photo_id]
    );
    return result.insertId;
}

async function verifyAccount(username, password) {
    const [result] = await sql.execute(
        'SELECT * FROM account WHERE username = ? AND password = ?',
        [username, password]
    );
    return result[0] || null;
}

async function getAccounts() {
    const [rows] = await sql.execute('SELECT * FROM account');
    return rows;
}

async function getAccountById(id) {
    const [rows] = await sql.execute('SELECT * FROM account WHERE id = ?', [id]);
    return rows[0] || null;
}

async function updateAccount(id, username, password, isAdmin, photo_id) {
    const [result] = await sql.execute(
        'UPDATE account SET username = ?, password = ?, isAdmin = ?, photo_id = ? WHERE id = ?',
        [username, password, isAdmin, photo_id, id]
    );
    return result.affectedRows;
}

async function deleteAccount(id) {
    // Get the account's photo id.
    const [account] = await sql.execute("SELECT photo_id FROM account WHERE id = ?", [id]);
    const photoId = account[0]?.photo_id;
    if (photoId) {
        await deletePhoto(photoId);
    }
    // Delete the account record.
    const [result] = await sql.execute("DELETE FROM account WHERE id = ?", [id]);
    return result.affectedRows;
}



// Updated getPhotoById remains similar but now uses the "name" column.
async function getPhotoById(id) {
    const [result] = await sql.execute("SELECT name FROM photos WHERE id = ?", [id]);
    const photoName = result[0]?.name;
    if (!photoName) return null;
    // Read the file from disk.
    const photoBuffer = await files.readFile(photoName);
    return photoBuffer;
}



async function updatePhoto(id, buffer) {
    const [rows] = await sql.execute("SELECT name FROM photos WHERE id = ?", [id]);
    const photoName = rows[0]?.name;
    if (!photoName) return 0;
    // Overwrite the file with the new content.
    await files.createFile(photoName, buffer);
    return 1; // Assume success.
}

async function deletePhoto(id) {
    // Retrieve the photo's file name.
    const [rows] = await sql.execute("SELECT name FROM photos WHERE id = ?", [id]);
    const photoName = rows[0]?.name;
    if (photoName) {
        try {
            await files.deleteFile(photoName);
        } catch (error) {
            console.error(`Error deleting file ${photoName}:`, error);
            // Optionally handle error (e.g., continue or abort deletion)
        }
    }
    // Delete the photo record.
    const [result] = await sql.execute("DELETE FROM photos WHERE id = ?", [id]);
    return result.affectedRows;
}


async function createProfile(accountId, buffer) {
    let photoId = null;
    if (buffer) {
        const [photoResult] = await sql.execute("INSERT INTO photos (photo) VALUES (?)", [buffer]);
        photoId = photoResult.insertId;
    }

    const [result] = await sql.execute(
        'INSERT INTO profile (account_id, photo_id) VALUES (?, ?)',
        [accountId, photoId]
    );
    return result.insertId;
}

async function getProfile(id) {
    const query = id ? `
        SELECT * FROM profile as p
        INNER JOIN account ON account.id = p.account_id
        WHERE p.id = ?` : `
        SELECT * FROM profile as p
        LEFT JOIN account ON account.id = p.account_id`;
    
    const [rows] = await sql.execute(query, id ? [id] : []);
    return rows;
}

async function searchProfiles(query) {
    const [rows] = await sql.execute(`
        SELECT * FROM account as a
        INNER JOIN profile as p ON a.id = p.account_id
        WHERE a.username LIKE CONCAT('%',?,'%')`, [query]);
    return rows;
}

async function computeUpvotes(author) {
    const [postResult] = await sql.execute(`
        SELECT SUM(b.upvotes) as total 
        FROM post as p
        JOIN button as b ON b.post_id = p.id
        WHERE p.author = ?`, [author]);

    const [replyResult] = await sql.execute(`
        SELECT SUM(rb.upvotes) as total 
        FROM reply as r
        JOIN replyButton as rb ON rb.reply_id = r.id
        WHERE r.author = ?`, [author]);

    return (postResult[0]?.total || 0) + (replyResult[0]?.total || 0);
}

async function updateProfile(id, job_title, interests, education, buffer) {
    const connection = await sql.getConnection();
    try {
        await connection.beginTransaction();
        let photo_id = null;
        if (buffer) {
            photo_id = await insertPhoto(buffer, connection);
        } else {
            const [rows] = await connection.execute('SELECT photo_id FROM profile WHERE id = ?', [id]);
            photo_id = rows[0]?.photo_id;
        }
        const [result] = await connection.execute(
            'UPDATE profile SET job_title = ?, interests = ?, education = ?, photo_id = ? WHERE id = ?',
            [job_title, interests, education, photo_id, id]
        );
        await connection.commit();
        return result.affectedRows;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/*inserts photoid  into database 
 * then will use it to stash it in the filesystem
 * returns the photoid 
 */


async function insertPhoto(buffer, connection = null) {
    if (!buffer) return null;
    // Use the provided connection if available, otherwise the pool (sql).
    const executor = connection || sql;
    // Insert a placeholder record with an empty name.
    const [result] = await executor.execute("INSERT INTO photos (name) VALUES (?)", [""]);
    const photoId = result.insertId;
    // Generate the file name from the photoId.
    const photoName = files.idToJpgName(photoId);
    // Update the record with the file name.
    await executor.execute("UPDATE photos SET name = ? WHERE id = ?", [photoName, photoId]);
    // Write the file to disk.
    await files.createFile(photoName, buffer);
    return photoId;
}

module.exports = {
    setUp,
    getChannels,
    getChannelById,
    searchChannels,
    createChannel,
    updateChannel,
    deleteChannel,
    getChannelData,
    createPostWithPhoto,
    getPosts,
    getPostById,
    updatePost,
    deletePost,
    getReplies,
    getReplyById,
    getNestedReplies,
    createReplyWithPhoto,
    deleteReply,
    updateReply,
    getButtons,
    getButtonById,
    createButton,
    deleteButton,
    updateButton,
    createAccount,
    verifyAccount,
    getAccounts,
    getAccountById,
    updateAccount,
    deleteAccount,
    insertPhoto,
    getPhotoById,
    updatePhoto,
    deletePhoto,
    createProfile,
    getProfile,
    searchProfiles,
    computeUpvotes,
    updateProfile,
    createLogs,
    checkLogs,
    updateLogs
};
