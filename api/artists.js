// created by Will Fulton
const express = require('express'); // imports express
const artistsRouter = express.Router(); // creates router mounted at /api/artists path
const sqlite3 = require('sqlite3'); // imports sqlite3
// opens test database in process.env if created, else it opens database.sqlite
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// checks if req.body.artist has name, date of birth, and a biography
// returns 400 error if any is missing
function checkArtistRequirements (req, res, next) {
    const name = req.body.artist.name;
    const dateOfBirth = req.body.artist.dateOfBirth;
    const biography = req.body.artist.biography;
    if(!name || !dateOfBirth || !biography){
        res.sendStatus(400);
    } else {
        next();
    }
};

// takes all '/:artistId' paths and validates the id given
// puts artist in question to req.artist
artistsRouter.param('artistId', (req, res, next, artistId) => {
    const sql = 'SELECT * FROM Artist WHERE Artist.id = $artistId'
    const values = {$artistId: artistId};
    db.get(sql, values, (err, artist) => {
        if(err){
            next(err);
        } else if(artist) {
            req.artist = artist;
            next();
        } else {
            res.sendStatus(404);
        }
    });
});

// gets all employed artists in the Artist table
// if successful, will return 200 status code and all artists
artistsRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Artist WHERE Artist.is_currently_employed = 1;', 
    (err, artists) => {
        if(err){
            next(err);
        } else {
            res.status(200).json({ artists: artists });
        }
    });
});

// posts an artist to the Artist table
// send 400 error if given artist does not have name, date of birth, or biography
// if successful, will return 201 status code and the artist posted
artistsRouter.post('/', checkArtistRequirements, (req, res, next) => {
    const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1; // ternary operation
    const sql = 
    "INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed)" +
    "VALUES ($name, $dateOfBirth, $biography, $isCurrentlyEmployed)";
    const values = {
        $name: req.body.artist.name,
        $dateOfBirth: req.body.artist.dateOfBirth,
        $biography: req.body.artist.biography,
        $isCurrentlyEmployed: isCurrentlyEmployed
    };
    db.run(sql, values, function(err) {
        if(err){
            next(err);
        } else {
            const sql = `SELECT * FROM Artist WHERE Artist.id = ${this.lastID}`;
            db.get(sql, (err, artist) => {
                res.status(201).json({ artist: artist });
            });
        }
    });
});

// retrieves the given artist with that id and status code 200
artistsRouter.get('/:artistId', (req, res, next) => {
    res.status(200).json({ artist: req.artist });
});

// updates the artist with the given id
// send 400 error if given update does not have name, date of birth, or biography
// if successful, will return 200 status code and the artist updated
artistsRouter.put('/:artistId', checkArtistRequirements, (req, res, next) => {
    const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1; // ternary operation
    const sql = 
    "UPDATE Artist SET name = $name, date_of_birth = $dateOfBirth, biography = $biography," +
    "is_currently_employed = $isCurrentlyEmployed WHERE Artist.id = $artistId";
    const values = {
        $name: req.body.artist.name,
        $dateOfBirth: req.body.artist.dateOfBirth,
        $biography: req.body.artist.biography,
        $isCurrentlyEmployed: isCurrentlyEmployed,
        $artistId: req.params.artistId
    };

    db.run(sql, values, function(err) {
        if(err){
            next(err);
        } else {
            db.get(`SELECT * FROM Artist WHERE Artist.id = ${req.params.artistId}`, (err, artist) => {
                res.status(200).json({ artist: artist });
            });
        }
    });
});

// marks artist as unemployed, does not remove them from database
// if successful, will return 200 status code and the artist 'deleted'
artistsRouter.delete("/:artistId", (req, res, next) => {
    const sql = `UPDATE Artist SET is_currently_employed = 0 WHERE Artist.id = ${req.params.artistId}`;
    db.run(sql, function(err) {
        if(err){
            next(err);
        } else {
            db.get(`SELECT * FROM Artist WHERE Artist.id = ${req.params.artistId}`, (err, artist) => {
                res.status(200).send({ artist: artist });
            });
        }
    });
});
module.exports = artistsRouter; // for use in api.js