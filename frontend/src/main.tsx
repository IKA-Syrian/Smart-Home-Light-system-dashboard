import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { Toaster } from './components/ui/toaster'

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <WebSocketProvider>
      <App />
      <Toaster />
    </WebSocketProvider>
  </BrowserRouter>
);
