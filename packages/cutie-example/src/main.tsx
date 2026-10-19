import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { SamplesPage } from './SamplesPage.tsx';

const page = new URLSearchParams(window.location.search).get('page');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {page === 'samples' ? <SamplesPage /> : <App />}
  </StrictMode>,
);
