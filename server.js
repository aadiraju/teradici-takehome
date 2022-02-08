const express = require('express');
const redis = require('redis');
const axios = require('axios');
axios.defaults.adapter('axios/lib/adapters/http');

// Constants
const PORT = process.env.PORT || 8080;
const DEFAULT_START = '2019-06-01';
const DEFAULT_END = '2020-05-31';
const CACHE_TIME = 60 * 2 // 2 minutes

// App
const server = express();

server.get('/', (req, res) => {
    res.status(200).send('Teradici Takehome Challenge by Abhineeth');
});

/*
 * Get a list of unique users who have contributed to the repository in the given time range [start, end]
 * @param {string} start - The start date of the time range
 * @param {string} end - The end date of the time range
 * @returns [{name : String, email : String}] - A list of unique users who have contributed to the repository in the given time range
 */
server.get('/users', async (req, res) => {
    const start = req.query.start || DEFAULT_START;
    const end = req.query.end || DEFAULT_END;

    //check if date range is valid and throw error if not
    if (!isValidDateRange(start, end)) {
        res.status(400).send({message: 'Invalid date range'});
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

    redisClient.get(`users:${start}:${end}`).then(async (users) => {
        if (users) {
            //if cache is available, return the data
            res.status(200).send(JSON.parse(users));
        } else {
            // if cache is not available, fetch from GitHub and store in cache
            // Get the list of users from the GitHub API
            const {data} = await axios.get(`https://api.github.com/repos/teradici/deploy/commits?since=${start}&until=${end}`);

            // Generate an array with the relevant data retrieved from GitHub
            const users = data.map(({commit}) => {
                return {
                    name: commit.author.name, email: commit.author.email,
                };
            });

            // Filter out the duplicate users and return the unique users as an array of objects
            const uniqueUsers = [...new Map(users.map(user => [user.email, user])).values()];

            // Store the unique users in the cache
            await redisClient.setEx(`users:${start}:${end}`, CACHE_TIME, JSON.stringify(uniqueUsers));

            //Return the users as a JSON object
            res.status(200).send(uniqueUsers);
        }
    }).catch(err => {
        // If there is an error, return the error
        res.status(500).send({message: err.message});
    });
});

/*
 * Get a list of the top 5 contributors to the repository in the given time range [start, end]
 * @param {string} start - The start date of the time range
 * @param {string} end - The end date of the time range
 * @returns [{name : String, commits : number}] - A sorted list of the top 5 contributors to the repository in the given time range
 */
server.get('/most-frequent', async (req, res) => {
    const start = req.query.start || DEFAULT_START;
    const end = req.query.end || DEFAULT_END;

    //check if date range is valid and throw error if not
    if (!isValidDateRange(start, end)) {
        res.status(400).send({message: 'Invalid date range'});
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

    redisClient.get(`most-frequent:${start}:${end}`).then(async (mostFrequentUsers) => {
        if (mostFrequentUsers) {
            //if cache is available, return the data
            res.status(200).send(JSON.parse(mostFrequentUsers));
        } else {
            // if cache is not available, fetch from GitHub and store in cache
            const {data} = await axios.get(`https://api.github.com/repos/teradici/deploy/commits?since=${start}&until=${end}`);

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

            // Store the unique users in the cache
            await redisClient.setEx(`most-frequent:${start}:${end}`, CACHE_TIME, JSON.stringify(mostFrequentUsers));

            //Return the users as a JSON object
            res.status(200).send(mostFrequentUsers);
        }
    }).catch(err => {
        // If there is an error, return the error
        res.status(500).send({message: err.message});
    });
});

//Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

//Helper Functions

//Check if the date range given is valid
function isValidDateRange(start, end) {
    const startTime = new Date(start);
    const endTime = new Date(end);
    // if either one is invalid, then value becomes NaN, and NaN compared to anything returns false
    return startTime < endTime;
}

module.exports = server;
