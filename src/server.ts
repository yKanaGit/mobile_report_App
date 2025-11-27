import express from 'express';

const app = express();
const port = process.env.PORT ?? 8000;

app.use(express.json());

app.post('/api/analyze-image', async (_req, res) => {
  try {
    console.log('API received request');

    res.json({
      ok: true,
      message: 'API is working! (モデル連携はまだです)'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
