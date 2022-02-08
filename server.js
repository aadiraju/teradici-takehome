const express = require('express');
const redis = require('redis');
const {Octokit} = require('@octokit/core');

// Constants
const PORT = process.env.PORT || 8080;

// App
const app = express();

//Setup Redis
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
});

app.get('/', (req, res) => {
    res.send('Teradici Takehome Challenge by Abhineeth');
});

app.get('/users', (req, res) => {
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
        const users = data.map(({commit}) => {
            return {
                name: commit.author.name, email: commit.author.email,
            };
        });

        // Filter out the duplicate users and return the unique users as an array of objects
        return [...new Map(users.map(user => [user.email, user])).values()];
    })().then((users) => {
        res.send(users);
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
