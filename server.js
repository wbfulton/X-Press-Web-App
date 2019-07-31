// created by Will Fulton
const express = require('express'); // imports express
const bodyParser = require('body-parser'); //imports body-parser
const cors = require('cors'); // imports cors
const errorhandler = require('errorhandler'); // imports errorhandler
const morgan = require('morgan'); // imports morgan documenation

const apiRouter = require('./api/api.js'); // imports apiRouter from api file in api directory

const app = express(); // creates an instance of an express app
const PORT = process.env.PORT || 4000; // port default is 4000

app.use(bodyParser.json()); // parses all req body info as a json file
app.use(cors()); // allows for backend to be accessed
app.use(morgan('dev')); // documents useful dev code to terminal
app.use(errorhandler()); // handles errors

app.use('/api', apiRouter); // mounts apiRouter at all routes with /api path

// app will listen at the given port
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

module.exports = app; // for testing purposes