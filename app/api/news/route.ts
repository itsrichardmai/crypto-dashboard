import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'cryptocurrency';

  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: query,
        sortBy: 'publishedAt',
        language: 'en',
        pageSize: 5,
        apiKey: process.env.NEWSAPI_KEY,
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('NewsAPI Error:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}