# Teradici Takehome Challenge by Abhineeth A.

A NodeJS REST API built with Express that retrieves data from Github.

## Starting the Project

To run the project, make sure you have docker installed have it running.

Then build the project using the following command:

```shell
docker-compose build
```

Then run the project using the following command:

```shell
docker-compose up
```

alternatively, you can combine the two commands and just run:

```shell
docker-compose up --build
```

## Run Tests

To run the tests for the project, build the application with `docker-compose build`, and then run the tests with:

```shell
docker-compose run node npm test
```

## API Endpoints

### `/users[?start=<start>&end=<end>]`

Returns a list of users who committed to https://github.com/teradici/deploy
between `start` and `end`.

The default values are:

- `start`: `2019-06-01`
- `end`: `2020-05-31`

### `/most-frequent[?start=<start>&end=<end>]`

Returns a sorted list of the top 5 contributors and the number of commits they pushed
to https://github.com/teradici/deploy
between `start` and `end`.

The default values are:

- `start`: `2019-06-01`
- `end`: `2020-05-31`
