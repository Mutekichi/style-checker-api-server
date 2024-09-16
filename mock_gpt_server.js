import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
app.use(express.json());
app.use(cors());

const upload = multer({ dest: 'uploads/' });

// モックレスポンスを生成する関数
function generateMockResponse(prompt) {
  const appearanceCheck = {
    dress: {
      OK: Math.random() > 0.5,
      comment: "服装は適切です。清潔感があり、場面に合っています。",
    },
    grooming: {
      OK: Math.random() > 0.5,
      comment: "身だしなみは整っています。髪や肌の手入れが行き届いています。",
    },
    visual: {
      OK: Math.random() > 0.5,
      comment: "全体的な印象は良好です。自信に満ちた様子が伺えます。",
    },
  };

  return JSON.stringify(appearanceCheck);
}

app.post('/api/chatgpt-stream', upload.single('image'), (req, res) => {
  console.log('Received request to /api/chatgpt-stream');
  console.log('Request body:', req.body);

  const { prompt } = req.body;
  const image = req.file;

  if (!prompt) {
    console.error('Error: No prompt provided in the request body');
    return res.status(400).json({ error: 'No prompt provided' });
  }

  console.log('Prompt:', prompt);
  if (image) {
    console.log('Image received:', image.originalname);
  }

  const mockResponse = generateMockResponse(prompt);

  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Transfer-Encoding': 'chunked'
  });

  // ストリーミングをシミュレート
  const chunks = mockResponse.split('');
  let index = 0;

  const interval = setInterval(() => {
    if (index < chunks.length) {
      res.write(chunks[index]);
      index++;
    } else {
      clearInterval(interval);
      res.end();
      console.log('Finished streaming mock response');
    }
  }, 10);  // 10ミリ秒ごとに1文字を送信
});

app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ message: 'Mock server test endpoint working' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Mock server running on port ${PORT}`);
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected error occurred', details: err.message });
});