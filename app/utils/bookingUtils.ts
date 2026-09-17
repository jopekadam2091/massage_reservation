export function parseBookingDetails(summary: string, description: string) {
  const desc = description || '';

  const refMatch = (summary + ' ' + desc).match(/#?(RES-[A-Z0-9]+)/i);
  const bookingRef = refMatch ? refMatch[1].toUpperCase() : null;

  const getLine = (keyword: string) => {
    const line = desc.split('\n').find((l) => l.toLowerCase().startsWith(keyword.toLowerCase()));
    if (!line) return null;
    return line.split(':').slice(1).join(':').trim();
  };

  const name = getLine('Meno') || summary.replace(/^REZERVÁCIA:\s*/i, '').split('-')[0]?.trim() || 'Hosť';
  const email = getLine('Email');
  const phone = getLine('Tel');
  const instagram = getLine('IG');
  const packageType = getLine('Balíček');
  const basePrice = getLine('Pôvodná cena');
  const finalPrice = getLine('Finálna cena');
  const notes = getLine('Poznámky & Odmeny') || getLine('Poznámka klienta');

  return {
    bookingRef,
    name,
    email,
    phone,
    instagram,
    packageType,
    basePrice,
    finalPrice,
    notes,
  };
}

export function formatCreationTime(dateStr?: string | null, language: string = 'sk') {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  let relative = '';
  if (diffMinutes < 1) {
    relative = language === 'sk' ? 'práve teraz' : 'just now';
  } else if (diffMinutes < 60) {
    relative = language === 'sk' ? `pred ${diffMinutes} min` : `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    relative = language === 'sk' ? `pred ${diffHours} h` : `${diffHours}h ago`;
  } else if (diffDays === 1) {
    relative = language === 'sk' ? 'včera' : 'yesterday';
  } else if (diffDays < 7) {
    relative = language === 'sk' ? `pred ${diffDays} dňami` : `${diffDays}d ago`;
  } else {
    relative = date.toLocaleDateString(language === 'sk' ? 'sk-SK' : 'en-US', {
      day: 'numeric',
      month: 'numeric',
    });
  }

  const formattedDateTime = date.toLocaleDateString(language === 'sk' ? 'sk-SK' : 'en-US', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    formattedDateTime,
    relative,
  };
}

export function findLatestBookingForUser(
  user: { email: string; full_name?: string | null }, 
  bookings: any[]
) {
  if (!bookings || bookings.length === 0) return null;
  const userEmail = (user.email || '').trim().toLowerCase();
  const userName = (user.full_name || '').trim().toLowerCase();

  const userBookings = bookings.filter((b) => {
    const parsed = parseBookingDetails(b.summary, b.description);
    const bEmail = (parsed.email || '').trim().toLowerCase();
    const bName = (parsed.name || '').trim().toLowerCase();

    if (userEmail && bEmail && bEmail !== '-' && bEmail === userEmail) return true;
    if (userName && bName && bName !== 'hosť' && bName === userName) return true;
    return false;
  });

  if (userBookings.length === 0) return null;

  // Sort by created descending, or start descending
  userBookings.sort((a, b) => {
    const timeA = a.created ? new Date(a.created).getTime() : new Date(a.start).getTime();
    const timeB = b.created ? new Date(b.created).getTime() : new Date(b.start).getTime();
    return timeB - timeA;
  });

  const latest = userBookings[0];
  const parsed = parseBookingDetails(latest.summary, latest.description);

  return {
    id: latest.id,
    created: latest.created || null,
    start: latest.start,
    summary: latest.summary,
    packageType: parsed.packageType,
    bookingRef: parsed.bookingRef,
    count: userBookings.length,
  };
}

export function isWithinRegistrationPeriod(dateStr: string | undefined | null, period: string): boolean {
  if (period === 'all') return true;
  if (!dateStr) return false;
  const regDate = new Date(dateStr);
  if (isNaN(regDate.getTime())) return false;

  const now = new Date();
  const regTime = regDate.getTime();
  const nowTime = now.getTime();

  if (period === 'today') {
    return regDate.toDateString() === now.toDateString();
  }
  if (period === 'week') {
    return nowTime - regTime <= 7 * 24 * 60 * 60 * 1000 && regTime <= nowTime;
  }
  if (period === 'month') {
    return nowTime - regTime <= 30 * 24 * 60 * 60 * 1000 && regTime <= nowTime;
  }
  if (period === 'year') {
    return regDate.getFullYear() === now.getFullYear();
  }
  return true;
}

