import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeContextProvider } from '../context'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import AppShell from '../components/AppShell'
import Inbox from '../pages/Inbox'
import Collections from '../pages/Collections'
import Rules from '../pages/Rules'
import Analytics from '../pages/Analytics'
import Settings from '../pages/Settings' // Re-using existing settings for now
import { useThemeContext } from '../context'

const SidePanelApp = () => {
  const { resolvedMode } = useThemeContext();

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: resolvedMode,
          ...(resolvedMode === "dark"
            ? {
                primary: { main: "#FFFFFF" },
                secondary: { main: "#B0B0B0" },
                background: {
                  default: "#000000",
                  paper: "#121212",
                },
                text: {
                  primary: "#FFFFFF",
                  secondary: "#B0B0B0",
                },
                divider: "#333333",
              }
            : {
                primary: { main: "#000000" },
                secondary: { main: "#757575" },
                background: {
                  default: "#FFFFFF",
                  paper: "#FFFFFF",
                },
                text: {
                  primary: "#000000",
                  secondary: "#555555",
                },
                divider: "#E0E0E0",
              }),
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            fontSize: 13,
             h6: {
                fontWeight: 600,
                fontSize: '1rem',
              },
        },
         shape: {
            borderRadius: 4,
          },
          components: {
             MuiButton: {
              styleOverrides: {
                root: {
                  borderRadius: 4,
                  textTransform: 'none',
                  fontWeight: 500,
                  boxShadow: 'none',
                   '&:hover': {
                    boxShadow: 'none',
                  },
                },
              },
            },
            MuiPaper: {
                styleOverrides: {
                  root: {
                    backgroundImage: "none",
                     boxShadow: "none",
                     border: resolvedMode === 'dark' ? "1px solid #333" : "1px solid #E0E0E0",
                  }
                }
            }
          }
      }),
    [resolvedMode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <AppShell>
           <Routes>
            <Route path="/" element={<Inbox />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppShell>
      </HashRouter>
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeContextProvider>
        <SidePanelApp />
    </ThemeContextProvider>
  </React.StrictMode>,
)
