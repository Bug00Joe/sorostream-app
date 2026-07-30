/**
 * Privacy-respecting analytics tracking
 * Tracks key user actions without personal data
 */

export type AnalyticsEvent =
  | { type: 'page_view'; page: string }
  | { type: 'wallet_connect'; success: boolean }
  | { type: 'stream_create_start' }
  | { type: 'stream_create_complete'; streamId?: string }
  | { type: 'stream_view'; streamId: string }
  | { type: 'stream_withdraw'; streamId: string; success: boolean }
  | { type: 'stream_cancel'; streamId: string; success: boolean }
  | { type: 'onboarding_start' }
  | { type: 'onboarding_step_complete'; step: number; stepId: string }
  | { type: 'onboarding_skip'; step: number; stepId: string }
  | { type: 'onboarding_complete' };

let isInitialized = false;

/**
 * Initialize analytics (call once at app startup)
 */
export function initAnalytics() {
  if (isInitialized) return;
  isInitialized = true;
  
  // In production, this would initialize your analytics provider
  // For now, we'll log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Initialized');
  }
}

/**
 * Track an analytics event
 */
export function trackEvent(event: AnalyticsEvent) {
  if (!isInitialized) {
    console.warn('[Analytics] Not initialized. Call initAnalytics() first.');
    return;
  }

  // In development, log events to console
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event);
  }

  // In production, send to analytics provider
  // Example: sendToAnalyticsProvider(event);
  
  // For now, we'll store events in localStorage for demo purposes
  try {
    const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    events.push({ ...event, timestamp: Date.now() });
    // Keep only last 100 events
    if (events.length > 100) events.shift();
    localStorage.setItem('analytics_events', JSON.stringify(events));
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Get stored analytics events (for debugging/demo)
 */
export function getAnalyticsEvents(): AnalyticsEvent[] {
  try {
    return JSON.parse(localStorage.getItem('analytics_events') || '[]');
  } catch (e) {
    return [];
  }
}

/**
 * Clear stored analytics events
 */
export function clearAnalyticsEvents() {
  localStorage.removeItem('analytics_events');
}
