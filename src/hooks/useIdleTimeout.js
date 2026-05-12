import { useEffect, useRef, useCallback } from 'react';

export const useIdleTimeout = (onIdle, idleTime = 10 * 60 * 1000) => { // Default 10 menit (dalam milidetik)
  const timeoutRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(onIdle, idleTime);
  }, [onIdle, idleTime]);

  useEffect(() => {
    // Daftar event yang dianggap sebagai "Aktivitas User"
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    
    const handleEvent = () => resetTimer();

    // Pasang pendeteksi ke window
    events.forEach(event => window.addEventListener(event, handleEvent));
    resetTimer(); // Mulai timer pertama kali

    // Bersihkan event saat komponen dilepas (unmount)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(event => window.removeEventListener(event, handleEvent));
    };
  }, [resetTimer]);
};