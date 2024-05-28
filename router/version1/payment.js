const express = require('express');
const app = express.Router();

const db = require('../../dbconfig.js');



app.post('/subway/payment', (req, res) => {
    const { token , amount , discount , create_date_time   , sid , ref , order_id ,txid } = req.body
    try {
        return res.status(200).json({ code: "200" , message : 'success' , ref });
    } catch (error) {
        return res.status(500).json({ msg : "error" })
    }
  
});


module.exports = app;