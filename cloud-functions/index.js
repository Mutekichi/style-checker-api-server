import OpenAI from 'openai';
import fs from 'fs';
import { http } from '@google-cloud/functions-framework';
import cors from 'cors';
import Busboy from 'busboy';
import path from 'path';
import os from 'os';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const corsMiddleware = cors({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});

http('entryPoint',(req, res) => {
    corsMiddleware(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const busboy = new Busboy({ headers: req.headers });
        const fields = {};
        const tempdir = os.tmpdir();
        const uploads = {};
        const fileWrites = [];

        busboy.on('field', (fieldname, val) => {
            fields[fieldname] = val;
        });

        busboy.on('file', (fieldname, file, filename, _, mimetype) => {
            const filepath = path.join(tempdir, filename);
            uploads[fieldname] = { filepath, mimetype }

            const writeStream = fs.createWriteStream(filepath);
            file.pipe(writeStream);

            const promise = new Promise((resolve, reject) => {
                file.on('end', () => {
                    writeStream.end();
                });
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });

            fileWrites.push(promise);
        });

        busboy.on('finish', async () => {
            try {
                await Promise.all(fileWrites);
                const { filepath, mimetype } = uploads.image;
                const image = fs.readFileSync(filepath, { encoding: 'base64' });
                const prompt = fields.prompt;
                const messages = [
                    { 
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mimetype};base64,${image}`
                                }
                            }
                        ]
                    }
                ];
                const payload = {
                    model: "gpt-4o-mini",
                    messages: messages,
                    max_tokens: 1000,
                    stream: true,
                };
                const stream = await openai.chat.completions.create(payload);
                res.writeHead(200, {
                    'Content-Type': 'text/plain',
                    'Transfer-Encoding': 'chunked'
                });
                let totalTokens = 0;
                for await (const chunk of stream) {
                    if (chunk.choices[0]?.delta?.content) {
                        const content = chunk.choices[0].delta.content;
                        res.write(content);
                        totalTokens += content.split(' ').length;
                    }
                }
                res.end();
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        busboy.end(req.rawBody);
    });
});