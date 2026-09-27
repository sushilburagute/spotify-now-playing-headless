'use client'

import { useEffect } from 'react'
import { startAnalytics, trackAnalyticsEvent } from './analytics'

export function Analytics() {
  useEffect(() => {
    startAnalytics()

    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      const link = event.target.closest<HTMLElement>('[data-analytics-event]')
      const name = link?.dataset.analyticsEvent
      if (!name) return

      const parameters: Record<string, string> = {}
      if (link.dataset.analyticsFramework)
        parameters.framework = link.dataset.analyticsFramework
      if (link.dataset.analyticsDestination)
        parameters.destination = link.dataset.analyticsDestination
      if (link.dataset.analyticsResource)
        parameters.resource = link.dataset.analyticsResource

      trackAnalyticsEvent(name, parameters)
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return null
}
