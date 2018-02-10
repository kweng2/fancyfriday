const cookieName = 'voteOnce';
const ONE_DAY = '86400';

const voters = {};
const voteOnce = (req, res, next) => {
	if (!!req.cookies[cookieName]) {
		res.status(401).end();
	} else {
		res.set('Set-Cookie', `${cookieName}=exists; Max-Age=${ONE_DAY}`);
		next()
	}
};

module.exports = voteOnce;