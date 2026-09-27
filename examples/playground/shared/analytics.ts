import ReactGA from 'react-ga4'

const measurementId = 'G-3ED6NBR29Z'
const productionHost = 'spotify-headless.sush.dev'

let initialized = false

export function startAnalytics() {
  if (typeof window === 'undefined' || initialized) return
  if (window.location.hostname !== productionHost) return

  // GA4 sends one page_view when this tag is configured on each full page load.
  ReactGA.initialize(measurementId)
  initialized = true
}

export function trackAnalyticsEvent(
  name: string,
  parameters: Record<string, string | number | boolean> = {}
) {
  if (!initialized) return
  ReactGA.event(name, parameters)
}
