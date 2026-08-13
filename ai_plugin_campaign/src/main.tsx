import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { App } from './App';
import './styles/index.css';

const app = <App />;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {import.meta.env.MODE === 'online' ? (
      <HashRouter>{app}</HashRouter>
    ) : (
      <BrowserRouter basename={import.meta.env.BASE_URL}>{app}</BrowserRouter>
    )}
  </StrictMode>,
);
