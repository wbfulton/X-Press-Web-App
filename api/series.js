// created by Will Fulton
const express = require('express'); // imports express
const seriesRouter = express.Router(); /// creates router for the series filepath
const issuesRouter = require('./issues.js');

const sqlite3 = require('sqlite3'); // imports sqlite3
// opens test database in process.env if created, else it opens database.sqlite
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

seriesRouter.use('/:seriesId/issues', issuesRouter);


// middleware that checks if given series object has a name and description
// send 400 status code if either is missing
function checkSeriesRequirements (req, res , next) {
    const name = req.body.series.name;
    const description = req.body.series.description;
    if(!name || !description){
        res.sendStatus(400);
    } else {
        next();
    }
};


// verfies that given id exists, will return 404 error if it does not exist
// if series exists, req.series will be set to the given artist
seriesRouter.param('seriesId', (req, res, next, seriesId) => {
    const sql = 'SELECT * FROM Series WHERE Series.id = $id';
    const values = {$id: seriesId};

    db.get(sql, values, (err, series) => {
        if(err){
            next(err);
        } else if (series){
            req.series = series;
            next();
        } else {
            return res.sendStatus(404);
        }
    });
});

// gets all series in the Series table
seriesRouter.get('/', (req, res, next) => {
    const sql = 'SELECT * FROM Series';

    db.all(sql, (err, series) => {
        if(err){
            next(err);
        } else {
            return res.status(200).json({series: series});
        }
    });
});

// gets the series by id, will return 404 error if user does not exist
seriesRouter.get('/:seriesId', (req, res, next) => {
    return res.status(200).json({ series: req.series });
});

// posts the given series in the Series table, if successful will return 201 status code
// if given series is missing name or description, will return 400 status code
seriesRouter.post('/', checkSeriesRequirements, (req, res, next) => {
    const sql = 'INSERT INTO Series (name, description)' +
                'VALUES ($name, $description)';
    const values = {
        $name: req.body.series.name,
        $description: req.body.series.description
    };

    db.run(sql, values,  
    function(err) {
        if(err){
            next(err);
        } else {
            const sql = `SELECT * FROM Series WHERE Series.id = ${this.lastID}`;

            db.get(sql, (err, series) => {
                res.status(201).json({ series: series });
            });
        }
    });
});

// updates the a series by id, return 400 error if series update object is missing name or description
// if successful, will return updated object and 200 status code
seriesRouter.put('/:seriesId', checkSeriesRequirements, (req, res, next) => {
    const sql = 'UPDATE Series SET name = $name, description = $description WHERE Series.id = $id';
    const values = {
        $name: req.body.series.name,
        $description: req.body.series.description,
        $id: req.params.seriesId
    };

    db.run(sql, values, function(err) {
        if(err){
            next(err);
        } else {
            const sql = `SELECT * FROM Series WHERE Series.id = ${req.params.seriesId}`;

            db.get(sql, (err, series) => {
                res.status(200).json({ series: series });
            });
        }
    });
});

// deletes series with the give id. Can only delte series that have no issues
// If series has issue, will send 400 response. If successful will send 204 status code
seriesRouter.delete('/:seriesId', (req, res, next) => {
    const issueSql = `SELECT * FROM Issue WHERE Issue.series_id = ${req.params.seriesId}`;

    db.get(issueSql, (err, issue) => {
        if(err){
            next(err);
        } else if (issue){
            res.sendStatus(400);
        } else {
            const deleteSql = `DELETE FROM Series WHERE Series.id = ${req.params.seriesId}`;

            db.run(deleteSql, function(err) {
                if(err){
                    next(err);
                } else {
                    res.sendStatus(204);
                }
            });
        }
    });
});

module.exports = seriesRouter; // exports router for use in the api.js file