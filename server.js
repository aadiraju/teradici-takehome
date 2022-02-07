const express = require('express');
const redis = require('redis');
const {Octokit} = require('@octokit/core');

// Constants
const PORT = process.env.PORT || 8080;

// App
const app = express();
app.get('/', (req, res) => {
    (async function () {
        const octokit = new Octokit({
            userAgent: 'tradiciTakehome',
        });
        const {data} = await octokit.request('GET /repos/{owner}/{repo}/commits?since=2019-06-01&until=2020-05-31', {
            owner: 'teradici',
            repo: 'deploy',
        });
        return data;
    })().then((data) => {
        res.send(data);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
