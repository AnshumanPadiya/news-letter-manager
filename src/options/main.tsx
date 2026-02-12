import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeContextProvider, useThemeContext } from '../context'
import { ThemeProvider, createTheme, CssBaseline, Container, Box } from '@mui/material'
import Settings from '../pages/Settings'

const OptionsApp = () => {
  const { resolvedMode } = useThemeContext();

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: resolvedMode,
          ...(resolvedMode === "dark"
            ? {
                primary: { main: "#FFFFFF" },
                background: { default: "#000000", paper: "#121212" },
                text: { primary: "#FFFFFF", secondary: "#B0B0B0" },
              }
            : {
                primary: { main: "#000000" },
                background: { default: "#FFFFFF", paper: "#FFFFFF" },
                text: { primary: "#000000", secondary: "#555555" },
              }),
        },
        typography: { fontFamily: '"Inter", sans-serif', fontSize: 13 },
        shape: { borderRadius: 4 },
        components: {
             MuiPaper: { styleOverrides: { root: { backgroundImage: "none", boxShadow: "none", border: resolvedMode === 'dark' ? "1px solid #333" : "1px solid #E0E0E0" } } }
        }
      }),
    [resolvedMode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
            <Settings />
        </Box>
      </Container>
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeContextProvider>
        <OptionsApp />
    </ThemeContextProvider>
  </React.StrictMode>,
)
