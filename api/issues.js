// created by Will Fulton
const express = require('express'); // imports express
const issuesRouter = express.Router({ mergeParams: true }); // allows us to use path /seriesId/issues

const sqlite3 = require('sqlite3'); // imports sqlite3
// opens test database in process.env if created, else it opens database.sqlite
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// middle ware that checks if the given issues id has a name,
// issue number, publication date, and artistId. The artist id
// also must correlate to an existing artist.
// send 400 status code if anything is missing
function checkIssueRequirements (req, res, next) {
    const name = req.body.issue.name;
    const issueNumber = req.body.issue.issueNumber;
    const publicationDate = req.body.issue.publicationDate;
    const artistId = req.body.issue.artistId;

    const artistSql = 'SELECT * FROM Artist WHERE Artist.id = $artistId';
    const artistValues = { $artistId: artistId };

    db.get(artistSql, artistValues, (err, artist) => {
        if(err){
            next(err);
        } else {
            // checks requirements
            if(!name || !publicationDate || !issueNumber || !artist) {
                return res.sendStatus(400);
            }
            next();
        }
    });
}


// checks the supplied issueId to see if the issue exists
// sends 404 status code if issue with id does not exist
issuesRouter.param('issueId', (req, res, next, issueId) => {
    const sql = `SELECT * FROM Issue WHERE Issue.id = $issueId`;
    const values = { $issueId: issueId }

    db.get(sql, values, (err, issue) => {
        if(err){
            next(err);
        } else if (issue) {
            next();
        } else {
            res.sendStatus(404);
        }
    });
});


// gets all issues from every artist
issuesRouter.get('/', (req, res, next) => {
    const sql = 'SELECT * FROM Issue WHERE Issue.series_id = $seriesId';
    const values = { $seriesId: req.params.seriesId };

    db.all(sql, values, (err, issues) => {
        if(err){
            next(err);
        } else {
            return res.status(200).json({ issues: issues });
        }
    });
});

// posts an issue for a given artist and series
// requires a given name, issueNumber, publicationDate, artistId
issuesRouter.post('/', checkIssueRequirements, (req, res, next) => {
    const sql = 'INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id)' +
        'VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)';
    const values = {
        $name : req.body.issue.name,
        $issueNumber : req.body.issue.issueNumber,
        $publicationDate : req.body.issue.publicationDate,
        $artistId : req.body.issue.artistId,
        $seriesId : req.params.seriesId
    };

    db.run(sql, values, function(err) {
        if(err){
              next(err);
        } else {
            const sql = `SELECT * FROM Issue WHERE Issue.id = ${this.lastID}`;

            db.get(sql, (err, issue) => {
                 return res.status(201).json({ issue: issue });
            });
        }
    });
});

// updates a issue with the given data. Need to be send a valid artist id and issue id. 404 error
// if not valid. Also needs to have a name, issue number, and pub date. 400 error if not followed
// will send back updates issue in json file
issuesRouter.put('/:issueId', checkIssueRequirements, (req, res, next) => {
    const sql = 'UPDATE Issue SET name = $name, issue_number = $issueNumber, ' +
            'publication_date = $publicationDate, artist_id = $artistId ' +
            'WHERE Issue.id = $issueId';
    const values = {
        $name : req.body.issue.name,
        $issueNumber : req.body.issue.issueNumber,
        $publicationDate : req.body.issue.publicationDate,
        $artistId : req.body.issue.artistId,
        $issueId : req.params.issueId
    };

    db.run(sql, values, function(err) {
        if(err){
            next(err);
        } else {
            const sql = `SELECT * FROM Issue WHERE Issue.id = ${req.params.issueId}`;

            db.get(sql, (err, issue) => {
                return res.status(200).json({ issue: issue });
            });
        }
    });
});

// deletes the issue with the given id
// if successful, will send 204 status code
issuesRouter.delete('/:issueId', (req, res, next) => {
    const sql = `DELETE FROM Issue WHERE Issue.id = ${req.params.issueId}`;

    db.run(sql, function(err) {
        if(err){
            next(err);
        } else {
            return res.sendStatus(204);
        }
    });
});

module.exports = issuesRouter; // exports router for use in series at /api/series/:seriesId/issues