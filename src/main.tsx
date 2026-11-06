import React from 'react';
import { createRoot } from 'react-dom/client';
import { Host } from './Host';
import { Player } from './Player';
import { Audio } from './Audio';
import './style.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode>{location.pathname === '/audio' ? <Audio /> : location.pathname === '/player' ? <Player /> : <Host />}</React.StrictMode>);
