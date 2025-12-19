import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || 'cryptocurrency';

  try {
    const response = await axios.get('https://newsdata.io/api/1/news', {
      params: {
        apikey: process.env.NEWSDATA_API_KEY,
        q: query,
        language: 'en',
        category: 'technology',
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Newsdata.io Error:', error.response?.data || error.message);
    return NextResponse.json({ 
      error: 'Failed to fetch news',
      results: [] 
    }, { status: 500 });
  }
}
