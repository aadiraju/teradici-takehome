const server = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const nock = require('nock');

//Setup Assertions
const expect = chai.expect;
chai.use(chaiHttp);

//Mock the API
const mockUser1 = {
    "commit": {
        "author": {
            "name": "TestUser",
            "email": "test@gmail.com"
        }
    }
};
const mockUser2 = {
    "commit": {
        "author": {
            "name": "TestUser2",
            "email": "test2@gmail.com"
        }
    }
};
const githubResponse = [mockUser1, mockUser2, mockUser2];
//Test base URL
describe('GET /', () => {
    it('should return a 200 response', (done) => {
        chai.request(server)
            .get('/')
            .end((err, res) => {
                expect(res).to.have.status(200);
                done();
            });
    });
});

//Test users endpoint when github successfully returns data AND when github returns an error
describe('GET /users when Github API call succeeds', () => {
    before(() => {
        // Mock a successful response from the GitHub API
        nock('https://api.github.com')
            .get('/repos/teradici/deploy/commits?since=2019-06-01&until=2020-05-31')
            .reply(200, githubResponse);
    });

    after(() => {
        nock.cleanAll();
    });

    it('should have a status code of 200', async () => {
        const res = await chai.request(server).get('/users');
        expect(res).to.have.status(200);
    });
    it('should return a list of users', async () => {
        const res = await chai.request(server).get('/users')
        expect(res.body).to.have.lengthOf(2);
        const expectedList = [
            {
                "name": githubResponse[0].commit.author.name,
                "email": githubResponse[0].commit.author.email
            },
            {
                "name": githubResponse[1].commit.author.name,
                "email": githubResponse[1].commit.author.email
            }];
        expect(res.body).to.deep.equal(expectedList);
    });
});

describe('GET /users when Github API call fails', () => {
    before(() => {
        // Mock a successful response from the GitHub API
        nock('https://api.github.com')
            .get('/repos/teradici/deploy/commits?since=2019-06-01&until=2020-02-31')
            .reply(500, {message: 'Internal Server Error'});
    });

    after(() => {
        nock.cleanAll();
    });

    it('should have a status code of 500', async () => {
        const res = await chai.request(server).get('/users?start=2019-06-01&end=2020-02-31');
        expect(res).to.have.status(500);
    });
});

//Test most-frequent endpoint when github successfully returns data AND when github returns an error
describe('GET /most-frequent when Github API call succeeds', () => {
    before(() => {
        // Mock a successful response from the GitHub API
        nock('https://api.github.com')
            .get('/repos/teradici/deploy/commits?since=2019-06-01&until=2020-05-31')
            .reply(200, githubResponse);
    });

    after(() => {
        nock.cleanAll();
    });

    it('should have a status code of 200', async () => {
        const res = await chai.request(server).get('/most-frequent');
        expect(res).to.have.status(200);
    });
    it('should return a list of most frequent contributors', async () => {
        const res = await chai.request(server).get('/most-frequent')
        expect(res.body).to.have.lengthOf(2);
        const expectedList = [
            {
                "name": githubResponse[1].commit.author.name,
                "commits": 2
            },
            {
                "name": githubResponse[0].commit.author.name,
                "commits": 1
            }];
        expect(res.body).to.deep.equal(expectedList);
    });
});

describe('GET /most-frequent when Github API call fails', () => {
    before(() => {
        // Mock a successful response from the GitHub API
        nock('https://api.github.com')
            .get('/repos/teradici/deploy/commits?since=2019-06-01&until=2020-02-31')
            .reply(500, {message: 'Internal Server Error'});
    });

    after(() => {
        nock.cleanAll();
    });

    it('should have a status code of 500', async () => {
        const res = await chai.request(server).get('/most-frequent?start=2019-06-01&end=2020-02-31');
        expect(res).to.have.status(500);
    });
});
