import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const upload = multer({ dest: 'uploads/' });

console.log('AWS Region:', process.env.AWS_REGION || 'Not set');
console.log('AWS Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set');
console.log('AWS Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');

const client = new BedrockRuntimeClient({ 
  region: process.env.AWS_REGION || "us-east-1"
});
const modelId = "anthropic.claude-3-5-sonnet-20240620-v1:0";

app.post('/api/claude-stream', upload.single('image'), async (req, res) => {
  console.log('Received request to /api/claude-stream');
  console.log('Request body:', req.body);

  const { prompt } = req.body;
  const image = req.file;

  if (!prompt) {
    console.error('Error: No prompt provided in the request body');
    return res.status(400).json({ error: 'No prompt provided' });
  }

  const messages = [
    {
      role: "user",
      content: [{ type: "text", text: prompt }],
    },
  ];

  if (image) {
    const imageBuffer = fs.readFileSync(image.path);
    const base64Image = imageBuffer.toString('base64');
    messages[0].content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: image.mimetype,
        data: base64Image
      }
    });
  }

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1000,
    messages: messages,
  };

  console.log('Prepared payload:', payload);

  const command = new InvokeModelWithResponseStreamCommand({
    contentType: "application/json",
    body: JSON.stringify(payload),
    modelId,
  });

  try {
    console.log('Sending request to Bedrock API');
    const apiResponse = await client.send(command);
    console.log('Received response from Bedrock API');

    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked'
    });

    for await (const item of apiResponse.body) {
      const chunk = JSON.parse(new TextDecoder().decode(item.chunk.bytes));
      console.log('Received chunk:', chunk);
      if (chunk.type === "content_block_delta") {
        res.write(chunk.delta.text);
      }
    }

    res.end();
    console.log('Finished streaming response');

    if (image) {
      fs.unlinkSync(image.path);
    }
  } catch (err) {
    console.error('Error in Bedrock API call:', err);
    res.status(500).json({ error: 'An error occurred while processing your request.', details: err.message });
  }
});

app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ message: 'Test endpoint working' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected error occurred', details: err.message });
});