const express = require('express');
const redis = require('redis');
const {Octokit} = require('@octokit/core');

// Constants
const PORT = process.env.PORT || 8080;
const DEFAULT_SINCE = '2019-06-01';
const DEFAULT_UNTIL = '2020-05-31';

// App
const app = express();

app.get('/', (req, res) => {
    res.status(500).send('Teradici Takehome Challenge by Abhineeth');
});

app.get('/users', async (req, res) => {
    const since = req.query.since || DEFAULT_SINCE;
    const until = req.query.until || DEFAULT_UNTIL;

    //check if date range is valid and throw error if not
    if (!isValidDateRange(since, until)) {
        res.status(400).send('Invalid date range');
        return;
    }

    //check if the cache is available
    //Setup Redis
    const redisClient = redis.createClient({
        url: process.env.REDIS_URL
    });

    //Setup listener for redis in case there is an error
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    await redisClient.connect();

    redisClient.get(`users:${since}:${until}`).then(async (users) => {
        if (users) {
            //if cache is available, return the data
            res.status(200).send(JSON.parse(users));
        } else {
            // if cache is not available, fetch from GitHub and store in cache
            // Set up Octokit instance with the right credentials
            const octokit = new Octokit({
                userAgent: 'tradiciTakehome',
            });
            // Get the list of users from the GitHub API
            const {data} = await octokit.request('GET /repos/{owner}/{repo}/commits?since={since}&until={until}', {
                owner: 'teradici',
                repo: 'deploy',
                since: since,
                until: until,
            });

            // Generate an array with the relevant data retrieved from GitHub
            const users = data.map(({commit}) => {
                return {
                    name: commit.author.name, email: commit.author.email,
                };
            });

            // Filter out the duplicate users and return the unique users as an array of objects
            const uniqueUsers = [...new Map(users.map(user => [user.email, user])).values()];

            // Store the unique users in the cache
            await redisClient.setEx(`users:${since}:${until}`, 120, JSON.stringify(uniqueUsers));

            //Return the users as a JSON object
            res.status(200).send(uniqueUsers);
        }
    }).catch(err => {
        // If there is an error, return the error
        res.status(500).send({message: err.message});
    });
});


app.get('/most-frequent', (req, res) => {
    (async function () {
        // Set up Octokit instance with the right credentials
        const octokit = new Octokit({
            userAgent: 'tradiciTakehome',
        });
        // Get the list of users from the GitHub API
        const {data} = await octokit.request('GET /repos/{owner}/{repo}/commits?since=2019-06-01&until=2020-05-31', {
            owner: 'teradici', repo: 'deploy',
        });

        // Generate an array with the relevant data retrieved from GitHub
        const userCommitCounts = new Map();

        data.forEach(({commit}) => {
            const user = commit.author.name;
            if (userCommitCounts.has(user)) {
                userCommitCounts.set(user, userCommitCounts.get(user) + 1);
            } else {
                userCommitCounts.set(user, 1);
            }
        });

        // Sort the map by the top 5 most frequent users
        const mostFrequentUsers = []
        userCommitCounts.forEach((value, key) => {
            mostFrequentUsers.push({
                name: key,
                commits: value,
            });
        });
        mostFrequentUsers.sort((a, b) => b.commits - a.commits).slice(0, 5);
        return mostFrequentUsers;
    })().then((users) => {
        res.send(users);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


//Helper Functions

//Check if the date range given is valid
function isValidDateRange(since, until) {
    const sinceTime = new Date(since);
    const untilTime = new Date(until);
    // if either one is invalid, then value becomes NaN, and NaN compared to anything returns false
    return sinceTime < untilTime;
}
