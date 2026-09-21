-- ==============================================================================
-- Tabuľka recenzií v Supabase pre aplikáciu MassageReservation
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_anonymous BOOLEAN DEFAULT FALSE,
    source TEXT DEFAULT 'profile',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

-- Indexy pre rýchle filtrovanie a zoradenie
CREATE INDEX IF NOT EXISTS idx_reviews_status_created ON public.reviews(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- Povolenie Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 1. Politika: Verejné čítanie schválených recenzií (pre Landing Screen a verejnú stránku)
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews" 
ON public.reviews FOR SELECT 
USING (status = 'approved');

-- 2. Politika: Ktokoľvek (prihlásený aj hosť) môže odoslať recenziu
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.reviews;
CREATE POLICY "Anyone can submit a review" 
ON public.reviews FOR INSERT 
WITH CHECK (true);

-- 3. Politika: Administrátori a serverové funkcie (Service Role) majú plný prístup (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins have full access" ON public.reviews;
CREATE POLICY "Admins have full access" 
ON public.reviews FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.role() = 'service_role');
