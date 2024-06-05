const express = require('express');
// const passport = require('passport');
var bodyParser = require('body-parser')
const _ = require("lodash");
const cors = require('cors'); // Import the cors middleware

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.text({ type: "text/*" }));
app.use(
    bodyParser.urlencoded({
        limit: "5mb",
        extended: true,
    })
);
app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Request methods you wish to allow
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );

    // Request headers you wish to allow
    res.setHeader(
        "Access-Control-Allow-Headers",
        "X-Requested-With,content-type"
    );
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader("Access-Control-Allow-Credentials", true);

    // Pass to next layer of middleware
    next();
});
const service_v1 = require('./router/version1/sevice_1');
const payment = require('./router/version1/payment');
const profile = require('./router/version1/profile');
const db = require('./dbconfig');

app.use('/api/v1', service_v1);
app.use('/api/v1/service', payment);
app.use('/api/v1/profile', profile);


app.use((req, res, next) => {
    res.status(404).send('Sorry, we could not find that!');
});
const server = app.listen(process.env.PORT || 3003,(elm)=>{
    console.log("runing app at: http://localhost:3003")
});
