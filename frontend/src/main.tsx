import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <SpeedInsights />
    <Analytics />
  </>,
)
