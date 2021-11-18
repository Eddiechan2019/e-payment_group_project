const express = require('express');
const bodyParser = require('body-parser');

const p2p = require("./app/controllers/p2p.controller.js");
const block = require('./app/controllers/block.controller.js');

// //init the p2p server
// p2p.initP2Pserver();

// create express app
const app = express();

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// parse requests of content-type - application/json
app.use(bodyParser.json())

// Configuring the database
const Config = require('./config/config.js');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

// Connecting to the database
mongoose.connect(Config.url, {
    useNewUrlParser: true
}).then(() => {
    console.log("Successfully connected to the database");
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});

// define a simple route
app.get('/', (req, res) => {
    res.json({ "message": "Welcome to COMP4142 E-Payment and Cryptocurrency, Group Project" });
});

require('./app/routes/block.routes.js')(app);
require('./app/routes/wallet.routes.js')(app);
require('./app/routes/p2p.routes.js')(app);

// listen for requests
app.listen(Config.express_port, () => {
    console.log("Server is listening on port " + Config.express_port);
});