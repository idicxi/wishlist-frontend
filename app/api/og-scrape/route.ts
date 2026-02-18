import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Добавляем https:// если нет
    let fullUrl = url.trim();
    if (!fullUrl.startsWith('http')) {
      fullUrl = 'https://' + fullUrl;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(
      `${apiBase.replace(/\/$/, '')}/api/parse-url?url=${encodeURIComponent(fullUrl)}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to parse');
    }

    const data = await response.json();
    
    return NextResponse.json({
      title: data.title || null,
      image: data.image || null,
      price: data.price || null,
    });
    
  } catch (error) {
    return NextResponse.json({
      title: null,
      image: null,
      price: null,
    });
  }
}