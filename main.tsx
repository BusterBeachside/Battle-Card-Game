
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Howl, Howler } from 'howler';

// Expose Howler globally for debugging
(window as any).Howler = Howler;

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
