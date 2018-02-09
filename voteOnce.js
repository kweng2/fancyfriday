const cookieName = 'voteOnce';

const voters = {};
const voteOnce = (req, res, next) => {
	if (!!req.cookies[cookieName]) {
		res.status(401).end();
	} else {
		res.set('Set-Cookie', `${cookieName}=exists; Max-Age=86400`);
		res.send('post success');
	}
};

module.exports = voteOnce;