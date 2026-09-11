import { NextResponse } from 'next/server';
import { getApprovedReviews, addReview } from '@/app/lib/reviewsStorage';

export async function GET() {
  try {
    const reviews = await getApprovedReviews();
    return NextResponse.json({ success: true, reviews });
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

    const newRev = await addReview({
      user_id: user_id || null,
      user_name: is_anonymous ? 'Anonymný užívateľ' : (user_name?.trim() || 'Klient salónu'),
      rating: validRating,
      comment: comment.trim(),
      status: 'pending', // Po odoslaní ide na schválenie do admin panelu
      is_anonymous: Boolean(is_anonymous),
      source: source || 'profile',
    });

    return NextResponse.json({ 
      success: true, 
      review: newRev, 
      message: 'Recenzia bola úspešne odoslaná na schválenie administrátorom.' 
    });
  } catch (error) {
    console.error('API POST /api/reviews error:', error);
    return NextResponse.json({ success: false, error: 'Chyba pri ukladaní recenzie.' }, { status: 500 });
  }
}
