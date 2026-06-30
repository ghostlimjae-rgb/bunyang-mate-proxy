// 파일 경로: api/debug-models.js
// 배포 후 https://[your-project].vercel.app/api/debug-models 로 접속해서 테스트

export const runtime = 'edge';
export const preferredRegion = ['hnd1', 'icn1', 'sin1'];

export default async function handler(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const models = ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'];
  const results = [];

  for (const model of models) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model, max_tokens: 10, messages: [{ role: 'user', content: 'hi' }] }),
      });
      const text = await res.text();
      const cfRay = res.headers.get('cf-ray') || 'none';
      results.push(`[${model}] HTTP ${res.status} (cf-ray:${cfRay}): ${text.slice(0, 150)}`);
    } catch (e) {
      results.push(`[${model}] ERROR: ${e.message}`);
    }
  }

  return new Response(results.join('\n\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
}
