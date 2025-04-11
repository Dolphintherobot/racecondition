const fs = require("fs/promises");

const filePath = process.env.FILE_PATH || "/app/files/"




async function readFile(name) {

	name = filePath + name;

	try{
		let temp =  await fs.readFile(name);
		return temp
		}
	catch (err) {
		console.log(err);
	}
}

/*
 * Given a buffer and a name
 * will create a file to stash it away in
 * assumes the filepath is not passed in and will be added in
 */
async function createFile(name,buffer) {

	name = filePath + name


	try {
	await fs.writeFile(name,buffer, {flag:"w",encoding:"base64"}); 
	}
	catch (err) {
		console.log(err)
	}


}

/*Deletes a file given its name
 * returns true upon success, false otherwise
 */
async function deleteFile(name) {

	name = filePath + name;
	//console.log(name);
	try {
		await fs.unlink(name)
		return true;
	}
	catch (err) {
	console.log(err)
		return false
	}
}


/*
 * Given a sql id will turn it into a string with the extension .jpg
 */
function idToJpgName(id) {
	return id.toString() + ".jpg"
}




module.exports = {
	readFile,
	createFile,
	idToJpgName,
	deleteFile,
}
