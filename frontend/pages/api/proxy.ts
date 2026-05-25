import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing stream URL' });
  }

  try {
    const targetUrl = decodeURIComponent(url);

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Range': req.headers.range || '',
        'Accept': 'video/*, audio/*',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return res.status(response.status).end();
    }

    // Forward important headers
    const headersToForward = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    headersToForward.forEach((header) => {
      const value = response.headers.get(header);
      if (value) res.setHeader(header, value);
    });

    res.setHeader('Access-Control-Allow-Origin', '*');

    if (response.body) {
      // Fix for ReadableStream → Next.js response
      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          break;
        }
        if (value) {
          res.write(value);
        }
      }
    } else {
      res.status(500).json({ error: 'No response body from source' });
    }
  } catch (error) {
    console.error('Proxy streaming error:', error);
    res.status(500).json({ error: 'Failed to stream video' });
  }
}