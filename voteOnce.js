const cookieName = 'voteOnce';
const ONE_DAY = '86400';

const voters = {};
const voteOnce = (req, res, next) => {
	if (!!req.cookies[cookieName]) {
		res.status(401).send('You have already voted');
	} else {
		res.set('Set-Cookie', `${cookieName}=exists; Max-Age=${ONE_DAY}`);
		next()
	}
};

module.exports = voteOnce;