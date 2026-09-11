-- Vytvorenie tabuľky recenzií v Supabase
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT NOT NULL,
    subtitle TEXT DEFAULT 'Overená návšteva',
    is_anonymous BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    language TEXT DEFAULT 'sk',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

-- Index pre rýchle načítanie schválených recenzií
CREATE INDEX IF NOT EXISTS idx_reviews_status_created ON public.reviews(status, created_at DESC);

-- Povolenie RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Politika: Verejné čítanie schválených recenzií
CREATE POLICY "Public can view approved reviews" 
ON public.reviews FOR SELECT 
USING (status = 'approved');

-- Politika: Prihlásení aj hostia môžu poslať recenziu
CREATE POLICY "Anyone can submit a review" 
ON public.reviews FOR INSERT 
WITH CHECK (true);

-- Politika: Správa pre administrátorov (Service Role / Admin)
CREATE POLICY "Admins have full access" 
ON public.reviews FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');
