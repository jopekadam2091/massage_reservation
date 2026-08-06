'use client';

import { useEffect } from 'react';

export default function PreventZoom() {
  useEffect(() => {
    // Zabránenie pinch-zoom gestám na iOS Safari a mobilných prehliadačoch
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    // Zabránenie nežiaducemu double-tap zoomovaniu
    let lastTouchEnd = 0;
    const preventDoubleTap = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'LABEL'].includes(e.target.tagName)) {
          // Povolíme štandardné klikanie pre ovládacie prvky
        } else {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    };

    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });
    document.addEventListener('touchend', preventDoubleTap, { passive: false });

    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
      document.removeEventListener('touchend', preventDoubleTap);
    };
  }, []);

  return null;
}
