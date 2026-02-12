import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { Layout } from "./components";
import { Dashboard, Archive, Settings, Subscriptions } from "./pages";
import { ThemeContextProvider, useThemeContext } from "./context";
import "./index.css";

const AppContent = () => {
  const { resolvedMode } = useThemeContext();

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: resolvedMode,
          ...(resolvedMode === "dark"
            ? {
                // Dark Mode - Minimalist Black
                primary: { main: "#FFFFFF" }, // White actions
                secondary: { main: "#B0B0B0" }, // Grey secondary
                background: {
                  default: "#000000", // Pure Black
                  paper: "#121212", // Very Dark Grey
                },
                text: {
                  primary: "#FFFFFF",
                  secondary: "#B0B0B0",
                },
                divider: "#333333",
              }
            : {
                // Light Mode - Minimalist White
                primary: { main: "#000000" }, // Black actions
                secondary: { main: "#757575" }, // Grey secondary
                background: {
                  default: "#FFFFFF", // Pure White
                  paper: "#FFFFFF", // Pure White
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
          fontSize: 13, // Slightly smaller font
          h4: {
            fontWeight: 300, // Thin
            letterSpacing: "-0.02em",
          },
          h5: {
            fontWeight: 400,
            letterSpacing: "-0.01em",
          },
          h6: {
            fontWeight: 500,
            letterSpacing: "0em",
          },
          button: {
            textTransform: "none",
            fontWeight: 500,
          },
        },
        shape: {
          borderRadius: 4, // Slightly sharper corners
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 4,
                boxShadow: "none",
                "&:hover": {
                  boxShadow: "none",
                },
              },
              contained: {
                "&:hover": {
                  boxShadow: "none",
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
                boxShadow: "none",
                border:
                  resolvedMode === "dark"
                    ? "1px solid #333"
                    : "1px solid #E0E0E0",
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(10px)",
                color: "#000000",
                borderBottom: "1px solid #E0E0E0",
                ...(resolvedMode === "dark" && {
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  color: "#FFFFFF",
                  borderBottom: "1px solid #333",
                }),
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                fontWeight: 500,
                border: "1px solid",
                borderColor: "transparent",
              },
              outlined: {
                borderColor: resolvedMode === "dark" ? "#333" : "#E0E0E0",
              },
            },
          },
        },
      }),
    [resolvedMode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/options" element={<Settings />} />
          </Routes>
        </Layout>
      </HashRouter>
    </ThemeProvider>
  );
};

const App = () => (
  <ThemeContextProvider>
    <AppContent />
  </ThemeContextProvider>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
