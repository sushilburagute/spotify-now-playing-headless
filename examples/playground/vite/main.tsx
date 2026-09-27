import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/space-grotesk/wght.css'
import { Playground } from '../shared/Playground'
import '../shared/styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Playground framework="react" />
  </StrictMode>
)
