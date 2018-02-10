const fs = require('fs');
const assert = require('assert');

const currentFilePath = 'results/current.csv';
const currentFileDir = 'results/';
const permission = 'r+';

let voting = false;
const getVoteStatus = () => voting;

const enableVote = (req, res) => {
	fs.open(currentFilePath, permission, (err, fd) => {
		try {
			assert.ifError(err);
			fs.ftruncate(fd, 0, (err) => {
				try {
					assert.ifError(err);
					voting = true;
					res.end();
				} catch (err) {
					console.log('Oh no! could not open file', err);
					res.status(400).send(err);
				}
			});
		} catch (err) {
			console.log('Oh no! could not truncate file', err);
			res.status(400).send(err);
		}
	});
};

const disableVote = (req, res) => {
	const rightNow = new Date();
	const newFileName = `${rightNow.getFullYear()}_${rightNow.getMonth()}_${rightNow.getDate()}.csv`;
	const newFilePath = `${currentFileDir}/${newFileName}`;
	try {
		fs.copyFileSync(currentFilePath, newFilePath);
	} catch (e) {
		console.log('Oh no! Attempt to copy current file to new name failed', e);
		return res.sendStatus(400)
	}
	console.log(`Successfully copied results to ${newFileName}`);
	voting = false;

	fs.readFile(newFilePath, 'utf8', (err, data) => {
		if (err) {
			console.log(`Could not read ${newFileName}`);
			return res.sendStatus(400);
		}
		const rawData = data.replace(/\n/g, ",").split(',');
		const map = {};
		console.log(rawData);
		rawData.filter(ele => ele !== '').forEach(name => {
			if (!map[name]) {
				map[name] = 0;
			}
			map[name]++;
		})
		res.send(map);
	});
};

module.exports = { enableVote, disableVote, getVoteStatus };







