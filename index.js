const readline = require('readline');
const express = require('express');
const google = require('googleapis');
const cookieParser = require('cookie-parser')
const OAuth2Client = google.auth.OAuth2;

const secret = require('./secret.json');
const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URL } = secret;
const tokens = {
	exists: false,
};

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
let drive;

const voteOnce = require('./voteOnce');
const vote = require('./vote');
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
			tokens.exists = true;
			console.log("successfully authenticated, authorized, and set tokens")
			res.redirect('/');
		}
	});
})

app.use((req, res, next) => {
	if (tokens.exists) {
		next();
	} else {
		const url = oauth2Client.generateAuthUrl({
			// access_type: 'offline', // will return a refresh token
			scope: 'https://www.googleapis.com/auth/drive' // can be a space-delimited string or an array of scopes
		});
		res.redirect(url);
	}
});
////////////////////////////////////////////////////////////////////////////////////

app.use(cookieParser())
app.use('/healthcheck', (req, res) => res.sendStatus(200));

app.get('/list', (req, res) => {
	drive.files.list({
		auth: oauth2Client,
		q: "mimeType='image/jpeg' and '1G9ehiJw_80qBBBnHDdqI2_B5t2VgIjfL' in parents",
		// q: "mimeType='application/vnd.google-apps.folder'",
		// q: "mimeType='image/jpeg'",
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
		auth: oauth2Client,
		q: "mimeType='application/vnd.google-apps.folder'",
		// q: "mimeType='application/vnd.google-apps.folder'",
		// q: "mimeType='image/jpeg'",
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

app.use('/vote', voteOnce);
// app.post('/vote', vote);

// app.get('/file', (req, res) => {
// 	drive.files.get({
// 		fileId: '1MJ3ir14IT3xgoRgNzGCO0Jv4darQaWK3',
// 		fields: 'webContentLink,webViewLink',
// 	}, (err, data) => {
// 		if (err) {
// 			console.log(err);
// 			res.sendStatus(400);
// 		} else {
// 			console.log(data.data);
// 			res.send(data.data);
// 		}
// 	});
// })

app.use(express.static('public'));

app.listen(3000, () => {
    console.log('Listening on port %d', 3000);
});
