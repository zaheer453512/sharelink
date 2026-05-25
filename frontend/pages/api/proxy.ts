import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {

    const url = req.query.url as string;

    if (!url) {
      return res.status(400).json({
        error: 'Missing URL'
      });
    }

    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',

      headers: req.headers.range
        ? {
            Range: req.headers.range
          }
        : {},

      maxRedirects: 5,
      timeout: 15000,
    });

    res.status(response.status === 206 ? 206 : 200);

res.setHeader(
  'Content-Type',
  String(response.headers['content-type'] || 'video/mp4')
);

if (response.headers['content-length']) {
  res.setHeader(
    'Content-Length',
    String(response.headers['content-length'])
  );
}

res.setHeader('Accept-Ranges', 'bytes');

if (response.headers['content-range']) {
  res.setHeader(
    'Content-Range',
    String(response.headers['content-range'])
  );
};

    response.data.pipe(res);

  } catch (err: any) {

    console.error(err);

    res.status(500).json({
      error: 'Proxy stream failed'
    });
  }
}