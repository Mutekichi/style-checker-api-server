# claude-api-server

This repository contains a server implementation for the Claude API.

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

The server will start on the port specified in your `.env` file (default is *3000*).

## Note

Ensure that you have the necessary permissions and have set up your AWS account correctly to use the Claude API.