import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function revealAppShell() {
  document.documentElement.classList.add('app-ready');
  const loader = document.getElementById('app-shell-loader');
  if (loader) {
    loader.setAttribute('hidden', '');
    loader.setAttribute('aria-busy', 'false');
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

requestAnimationFrame(() => {
  requestAnimationFrame(revealAppShell);
});
