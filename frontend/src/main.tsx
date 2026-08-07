import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SpeedInsights } from '@vercel/speed-insights/react'

/*
 * CSP-safe non-blocking font activation.
 * The Google Fonts stylesheet is loaded with media="print" so it never blocks
 * first paint; once it finishes loading we flip it to "all". The inline
 * onload="this.media='all'" trick is blocked by our Content-Security-Policy
 * (script-src 'self'), so we do it from an allowed module script instead.
 */
{
  const fontsLink = document.getElementById('fonts-css') as HTMLLinkElement | null;
  if (fontsLink) {
    const activate = () => { fontsLink.media = 'all'; };
    fontsLink.addEventListener('load', activate);
    // If the stylesheet was cached & already applied, activate immediately.
    if (fontsLink.sheet) activate();
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <SpeedInsights />
  </>,
)
