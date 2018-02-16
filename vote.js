const fs = require('fs');
const assert = require('assert');

const admin = require('./admin');
const { getVoteStatus } = admin;

const currentFilePath = 'results/current.csv';

/* const body = { 
 *     id_1: 'bob',
 *     id_2: 'bob',
 *     id_3: 'bob',
 * }
 */

const vote = (req, res) => {
	if (!getVoteStatus()) {
		console.log('Voting has closed');
		return res.status(400).send('Voting has closed');
	}
	console.log('request body:', req.body);

	const data = transformData(req.body);

	fs.appendFile(currentFilePath, data, (err) => {
		if (err) {
			console.log('failed to persist vote data');
			return res.sendStatus(400);
		}
		console.log('successfully saved vote data to disk')
		res.end();
	});
};

const transformData = (data) => {
	const ids = Object.keys(data);
	return ids.map(id => data[id]).join(',') + '\n';
}

module.exports = vote;