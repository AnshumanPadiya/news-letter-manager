import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, useMediaQuery } from '@mui/material';
import Popup from './popup/Popup';
import Options from './options/Options';
import './index.css';

const App = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
          ...(prefersDarkMode
            ? {
              // Dark mode colors
              background: {
                default: '#1a1a1a', // Charcoal black
                paper: '#2a2a2a',   // Slightly lighter for cards
              },
              primary: {
                main: '#90caf9',
              },
              secondary: {
                main: '#f48fb1',
              },
            }
            : {
              // Light mode colors
              background: {
                default: '#f5f5f5',
                paper: '#ffffff',
              },
              primary: {
                main: '#1976d2',
              },
              secondary: {
                main: '#dc004e',
              },
            }),
        },
      }),
    [prefersDarkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Popup />} />
          <Route path="/options" element={<Options />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
