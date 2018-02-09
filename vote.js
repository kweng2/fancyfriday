const vote = (req, res, next) => {
	if (!!req.cookies[cookieName]) {
		res.status(401).end();
	} else {
		res.set('Set-Cookie', `${cookieName}=exists; Max-Age=86400`);
		// res.send('post success');
		next();
	}
};

module.exports = vote;