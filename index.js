const fs = require('fs');
const readline = require('readline');
const express = require('express');
const google = require('googleapis');
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser');
const secret = require('./secret.json');

let tokenExists = false;
const OAuth2Client = google.auth.OAuth2;
const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URL } = secret;
const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

let drive;

const TOKEN_PATH = './credentials.json'
let credentials;
try {
	credentials = require(TOKEN_PATH);
	oauth2Client.setCredentials(credentials);
	drive = google.drive({
		version: 'v3',
		auth: oauth2Client,
	});
	tokenExists = true;
} catch (err) {
	console.log('Must authorize with Google API OAuth 2');
}

const voteOnce = require('./voteOnce');
const vote = require('./vote');
const admin = require('./admin');
const app = express();

////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////       LOGGING      ////////////////////////////////
app.use((req, res, next) => {
	console.log(`${req.method} ${req.originalUrl}`);
	next();
});


////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////       OAUTH         ////////////////////////////////
// middleware to make sure we have tokens
app.get('/oauthcallback', (req, res) => {
	const code = req.query.code;
	oauth2Client.getToken(code, (err, returnedTokens) => {
		// Now tokens contains an access_token and an optional refresh_token. Save them.
		if (!err) {
			oauth2Client.setCredentials(returnedTokens);
			drive = google.drive({
				version: 'v3',
				auth: oauth2Client,
			});
			console.log(returnedTokens);
			console.log('successfully authenticated and authorized')
			try {
				fs.writeFileSync(TOKEN_PATH, JSON.stringify(returnedTokens));
			} catch (err) {
				console.log('Could not save to disk');
			}
			console.log('Saved token to disk');
			tokenExists = true;
			res.redirect('/');
		}
	});
})

app.use((req, res, next) => {
	if (tokenExists) {
		next();
	} else {
		const url = oauth2Client.generateAuthUrl({
			scope: 'https://www.googleapis.com/auth/drive' // can be a space-delimited string or an array of scopes
		});
		res.redirect(url);
	}
});

////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////     Web APIs        ////////////////////////////////
app.get('/list', (req, res) => {
	drive.files.list({
		q: "mimeType='image/jpeg' and '1G9ehiJw_80qBBBnHDdqI2_B5t2VgIjfL' in parents",
		fields: 'files(id, name, webContentLink, webViewLink)',
	}, (err, data) => {
		if (err) {
			console.log(err);
			res.sendStatus(400);
		} else {
			console.log(data.data);
			res.send(data.data);
		}
	});
});

app.get('/listFolders', (req, res) => {
	drive.files.list({
		q: "mimeType='application/vnd.google-apps.folder'",
		fields: 'files(id, name)',
	}, (err, data) => {
		if (err) {
			console.log(err);
			res.sendStatus(400);
		} else {
			console.log(data.data);
			res.send(data.data);
		}
	});
});

////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////       VOTING       ////////////////////////////////
// enforces one time voting, (once per day)
app.use('/vote', cookieParser(), voteOnce);
app.post('/vote', bodyParser.json(), vote);

////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////       ADMIN        ////////////////////////////////
const { enableVote, disableVote } = admin;
app.post('/admin/vote/enable', enableVote);
app.post('/admin/vote/disable', disableVote);
app.post('/admin/vote/upload', (req, res) => {
	const currentFileDir = 'results/';
	const rightNow = new Date();
	const name = `${rightNow.getFullYear()}_${rightNow.getMonth()+1}_${rightNow.getDate()}.csv`;
	const path = `${currentFileDir}/${name}`;
	var fileMetadata = {
		'name': name,
		'mimeType': 'application/vnd.google-apps.spreadsheet'
	};
	var media = {
		mimeType: 'text/csv',
		body: fs.createReadStream(path)
	};
	drive.files.create(
	{
		resource: fileMetadata,
		media: media,
		fields: 'id'
	}, function (err, file) {
		if (err) {
			console.error('Oh no! Failed to upload results to Google Drive', err);
			res.sendStatus(400);
		} else {
			console.log('Successfully uploaded result to Google Drive');
			return res.end();
		}
	});
});

app.use(express.static('public'));

app.listen(3000, () => {
    console.log('Listening on port %d', 3000);
});
