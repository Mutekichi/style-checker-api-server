import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import OpenAI from 'openai';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const upload = multer({ dest: 'uploads/' });

console.log('Server startup:');
console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Set' : 'Not set');
console.log('Environment:', process.env.NODE_ENV || 'development');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/chatgpt-stream', upload.single('image'), async (req, res) => {
  console.log('--- New request to /api/chatgpt-stream ---');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('File received:', req.file ? `Yes (${req.file.originalname})` : 'No');

  const { prompt } = req.body;
  const image = req.file;

  if (!prompt) {
    console.error('Error: No prompt provided in the request body');
    return res.status(400).json({ error: 'No prompt provided' });
  }

  const messages = [
    { role: "user", content: prompt }
  ];

  if (image) {
    console.log(`Processing image: ${image.originalname} (${image.size} bytes)`);
    const base64Image = fs.readFileSync(image.path, { encoding: 'base64' });
    messages[0].content = [
      { type: "text", text: prompt },
      {
        type: "image_url",
        image_url: {
          url: `data:${image.mimetype};base64,${base64Image}`
        }
      }
    ];
    console.log('Image successfully processed and added to the message');
  }

  const payload = {
    model: "gpt-4o-mini",
    messages: messages,
    max_tokens: 1000,
    stream: true,
  };

  console.log('Prepared payload:', JSON.stringify(payload, null, 2));

  try {
    console.log('Sending request to ChatGPT API...');
    const stream = await openai.chat.completions.create(payload);
    console.log('Stream received from ChatGPT API');

    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked'
    });

    let totalTokens = 0;
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        res.write(content);
        totalTokens += content.split(' ').length;  // Rough estimate
        console.log(`Streamed ${content.length} characters`);
      }
    }

    res.end();
    console.log(`Finished streaming response. Estimated total tokens: ${totalTokens}`);

    if (image) {
      fs.unlinkSync(image.path);
      console.log(`Temporary image file deleted: ${image.path}`);
    }
  } catch (err) {
    console.error('Error in ChatGPT API call:', err);
    console.error('Error details:', err.response?.data || err.message);
    res.status(500).json({ error: 'An error occurred while processing your request.', details: err.message });
  }

  console.log('--- Request processing completed ---');
});

app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ message: 'Test endpoint working' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({ error: 'An unexpected error occurred', details: err.message });
});