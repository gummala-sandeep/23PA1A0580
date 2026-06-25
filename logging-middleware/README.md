# Logging Middleware

This package provides a simple reusable logging function for the AffordMed campus evaluation.

Instead of writing logging requests throughout the application, the `Log()` function can be used from both the frontend and backend to send logs to the evaluation server.

## Installation

```bash
npm install
```

## Usage

```javascript
const { Log } = require("./index");

await Log(
    "frontend",
    "info",
    "api",
    "Fetching notifications"
);
```

## Function

```javascript
Log(stack, level, package, message)
```

### Parameters

* **stack** – `frontend` or `backend`
* **level** – `debug`, `info`, `warn`, `error`, or `fatal`
* **package** – Package name as specified in the assessment
* **message** – Description of the event being logged


## Environment Configuration

The logging middleware reads sensitive configuration values from environment variables instead of hardcoding them in the source code.

Create a .env file inside the logging-middleware directory with the following variables:

ACCESS_TOKEN= ACCESS_TOKEN
LOG_API= LOG_API

These values are loaded during runtime and are used to authenticate requests made to the logging service.

## Note: The .env file contains sensitive credentials and should not be committed to version control.
## Notes

* All logs are sent to the evaluation logging API.
* The access token is included in the request header.
* The function returns the response received from the logging service.

This package is intended to be reused across different parts of the application wherever logging is required.
