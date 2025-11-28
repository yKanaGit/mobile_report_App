import express from 'express';

const app = express();
const port = process.env.PORT ?? 8000;

app.use(express.json());

app.post('/api/analyze-image', async (_req, res) => {
  console.log('*** analyze-image handler called ***');

  try {
    res.json({ ok: true, message: 'API is working!' });
  } catch (err) {
    console.error('*** analyze-image error ***', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
