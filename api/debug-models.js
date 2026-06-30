// 파일 경로: api/debug-models.js
// Node.js 서버리스 함수 형식 (req, res)

export default async function handler(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });
    return;
  }

  const models = ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'];
  const results = [];

  for (const model of models) {
    try {
      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model, max_tokens: 10, messages: [{ role: 'user', content: 'hi' }] }),
      });
      const text = await apiRes.text();
      const cfRay = apiRes.headers.get('cf-ray') || 'none';
      results.push(`[${model}] HTTP ${apiRes.status} (cf-ray:${cfRay}): ${text.slice(0, 150)}`);
    } catch (e) {
      results.push(`[${model}] ERROR: ${e.message}`);
    }
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(results.join('\n\n'));
}
