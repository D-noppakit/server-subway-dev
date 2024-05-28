const express = require('express');
const version1 = express.Router();

const db = require('../../dbconfig.js');



version1.post('/test', (req, res) => {
    // res.send('Welcome, ' + req.user.displayName + '! ' + req.user.id + '!');
    return res.status(200).json({ resCode: "00"});
});


module.exports = version1;