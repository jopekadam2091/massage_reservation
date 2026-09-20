import { NextResponse } from 'next/server';
import { getAllReviews, updateReviewStatus, deleteReview, addReview } from '@/app/lib/reviewsStorage';

export async function GET() {
  try {
    const reviews = await getAllReviews();
    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error('API GET /api/admin/reviews error:', error);
    return NextResponse.json({ success: false, error: 'Chyba načítania recenzií' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, status, reviewData } = body;

    if (action === 'update_status' && id && status) {
      if (status !== 'approved' && status !== 'rejected') {
        return NextResponse.json({ success: false, error: 'Neplatný status' }, { status: 400 });
      }
      const ok = await updateReviewStatus(id, status);
      return NextResponse.json({ success: ok });
    }

    if (action === 'delete' && id) {
      const ok = await deleteReview(id);
      return NextResponse.json({ success: ok });
    }

    if (action === 'create_manual' && reviewData) {
      const { user_name, rating, comment, is_anonymous } = reviewData;
      if (!comment || !rating) {
        return NextResponse.json({ success: false, error: 'Chýba text alebo hodnotenie' }, { status: 400 });
      }

      const created = await addReview({
        user_id: null,
        user_name: is_anonymous ? 'Anonymný užívateľ' : (user_name?.trim() || 'Klient'),
        rating: Math.max(1, Math.min(5, Math.round(Number(rating)))),
        comment: comment.trim(),
        status: 'approved', // Ručne pridaná recenzia adminom je rovno schválená
        is_anonymous: Boolean(is_anonymous),
        source: 'admin_manual',
      });

      return NextResponse.json({ success: true, review: created });
    }

    return NextResponse.json({ success: false, error: 'Neplatná akcia' }, { status: 400 });
  } catch (error) {
    console.error('API POST /api/admin/reviews error:', error);
    return NextResponse.json({ success: false, error: 'Chyba servera' }, { status: 500 });
  }
}
