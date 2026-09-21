import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // 1. Import bộ định tuyến
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. Bọc BrowserRouter bao quanh App */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)