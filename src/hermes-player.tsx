import React from 'react';
import { createRoot } from 'react-dom/client';
import { Player } from './Player';
import './hermes-config';
import './style.css';
createRoot(document.getElementById('root')!).render(<Player />);
