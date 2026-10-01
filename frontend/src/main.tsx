import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AdminPage from './pages/AdminPage.tsx'
import VerifyEmailPage from './pages/VerifyEmailPage.tsx'

const path = window.location.pathname

function Root() {
  if (path.startsWith('/admin')) return <AdminPage />
  if (path.startsWith('/verify-email')) return <VerifyEmailPage />
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
