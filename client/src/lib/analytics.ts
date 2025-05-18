// Define the gtag function globally
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Google Analytics'i başlat
export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('Google Analytics ölçüm kimliği eksik: VITE_GA_MEASUREMENT_ID');
    return;
  }

  // Google Analytics scriptini head'e ekle
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // gtag başlat
  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;
  document.head.appendChild(script2);
};

// Sayfa görüntülemelerini takip et - SPA için kullanışlı
export const trackPageView = (url: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;
  
  window.gtag('config', measurementId, {
    page_path: url
  });
};

// Olayları takip et
export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Kullanıcı etkileşimlerini takip et
export const trackUserInteraction = (
  type: 'click' | 'search' | 'booking' | 'registration' | 'login' | 'exam_start' | 'exam_complete',
  metadata?: Record<string, any>
) => {
  trackEvent(type, 'user_interaction', null, null);
  
  // Detaylı metadata'yı ayrı bir özel olay olarak gönder
  if (metadata && Object.keys(metadata).length > 0) {
    window.gtag?.('event', `${type}_details`, metadata);
  }
};