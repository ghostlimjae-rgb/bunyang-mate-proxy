// 파일 경로: api/anthropic-proxy.js (Vercel 프로젝트 루트의 api 폴더 안에 위치)
// 이 파일 하나만 있으면 Vercel이 자동으로 /api/anthropic-proxy 엔드포인트로 인식합니다.

export const runtime = 'edge';

// 홍콩(hkg1)을 피하고 한국에 가까운 리전으로 고정
// 도쿄(hnd1), 서울 인접 리전이 없어 도쿄가 가장 가깝습니다.
export const preferredRegion = ['hnd1', 'icn1', 'sin1'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
};

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured on Vercel' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.text();

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body,
    });

    // 스트리밍 응답인지 확인
    const contentType = anthropicRes.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      return new Response(anthropicRes.body, {
        status: anthropicRes.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
    }

    const text = await anthropicRes.text();
    return new Response(text, {
      status: anthropicRes.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
