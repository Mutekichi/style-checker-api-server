# style-checker-api-server

This repository contains the API server for the [StyleChecker](https://github.com/tanomitsu/StyleChecker) app.

## Installation

1. Clone the repository:
   ```
   git clone git@github.com:Mutekichi/claude-api-server.git
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Configuration

Create a `.env` file in the root directory and add the following environment variables:

### For OpenAI API server:
```
OPENAI_API_KEY=YOUR_API_KEY
PORT=3001
```
Replace `YOUR_API_KEY` with your actual OpenAI API key.

### For AWS server:
```
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
AWS_REGION=us-east-1
PORT=3001
```

Replace `YOUR_ACCESS_KEY` and `YOUR_SECRET_KEY` with your actual AWS credentials.

## Usage

To start the server, run:

```
npm start
```

If you want to run the mock server, run:
   
```
npm start:mock
```

The server will start on the port specified in your `.env` file (default is *3000*).

## Note

Ensure that you have the necessary permissions and credentials to access the OpenAI API or AWS services.