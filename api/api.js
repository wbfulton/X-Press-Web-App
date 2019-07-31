// created by Will Fulton
const express = require('express'); // imports express router
const apiRouter = express.Router(); // router is mounted at "/api" file path
const artistsRouter = require('./artists.js'); // imports router in artists file
const seriesRouter = require('./series.js'); // imports seriesRouter in series file

apiRouter.use('/artists', artistsRouter); // mounts artistsRouter at the /artists filepath
apiRouter.use('/series', seriesRouter); // mounts seriesRouter at the /series filepath

module.exports = apiRouter; // exports router for use in server.js