import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { initPwa } from '@/lib/pwa'

createRoot(document.getElementById("root")!).render(<App />);

initPwa();
