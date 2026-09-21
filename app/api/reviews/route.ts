import { NextResponse } from 'next/server';
import { getApprovedReviews, addReview } from '@/app/lib/reviewsStorage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const reviews = await getApprovedReviews();
    return NextResponse.json(
      { success: true, reviews },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('API GET /api/reviews error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, user_name, rating, comment, is_anonymous, source } = body;

    if (!rating || !comment || typeof comment !== 'string' || comment.trim().length < 3) {
      return NextResponse.json({ success: false, error: 'Neplatné hodnotenie alebo text recenzie.' }, { status: 400 });
    }

    const validRating = Math.max(1, Math.min(5, Math.round(Number(rating))));

    const isAnon = Boolean(is_anonymous) || !user_name || typeof user_name !== 'string' || !user_name.trim();
    const finalUserName = isAnon ? 'Anonymný užívateľ' : user_name.trim();

    const newRev = await addReview({
      user_id: user_id || null,
      user_name: finalUserName,
      rating: validRating,
      comment: comment.trim(),
      status: 'pending', // Po odoslaní ide na schválenie do admin panelu
      is_anonymous: isAnon,
      source: source || 'profile',
    });

    return NextResponse.json(
      { 
        success: true, 
        review: newRev, 
        message: 'Recenzia bola úspešne odoslaná na schválenie administrátorom.' 
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('API POST /api/reviews error:', error);
    return NextResponse.json({ success: false, error: 'Chyba pri ukladaní recenzie.' }, { status: 500 });
  }
}
