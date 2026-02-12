import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeContextProvider, useThemeContext } from '../context'
import { ThemeProvider, createTheme, CssBaseline, Box, Button, Typography, IconButton, Tooltip, Stack } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SettingsIcon from '@mui/icons-material/Settings';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const PopupContent = () => {
    const { resolvedMode } = useThemeContext();
    const [saved, setSaved] = React.useState(false);

    const theme = React.useMemo(() => createTheme({
         palette: {
          mode: resolvedMode,
           ...(resolvedMode === "dark"
            ? {
                primary: { main: "#FFFFFF" },
                background: { default: "#000000", paper: "#121212" },
                text: { primary: "#FFFFFF", secondary: "#B0B0B0" },
                divider: "#333333",
              }
            : {
                primary: { main: "#000000" },
                background: { default: "#FFFFFF", paper: "#FFFFFF" },
                text: { primary: "#000000", secondary: "#555555" },
                divider: "#E0E0E0",
              }),
        },
        typography: { fontFamily: '"Inter", sans-serif', fontSize: 13 },
        shape: { borderRadius: 4 },
        components: {
             MuiButton: { styleOverrides: { root: { textTransform: 'none', boxShadow: 'none' } } }
        }
    }), [resolvedMode]);

    const handleOpenSidePanel = () => {
         // Open side panel programmatically if supported (Chrome 116+)
         // Or just instruct user. For now, rely on window.close() + implicit behavior
         // or generic message.
         // Actually, the best way for now without user gesture limitations is to guide them
         // or use window.open if we were using a separate window.
         // For Side Panel, we can try:
         if (chrome.sidePanel && chrome.sidePanel.open) {
             chrome.windows.getCurrent({ populate: false }, (currentWindow) => {
                 if (currentWindow.id) {
                     chrome.sidePanel.open({ windowId: currentWindow.id });
                     window.close(); // Close popup
                 }
             });
         } else {
             // Fallback
             alert('Please click the "Show Side Panel" option in the browser toolbar.');
         }
    };

    const handleOpenSettings = () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    };

    const handleSavePage = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        // Mock save logic for now
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ width: 300, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" fontWeight={600}>Newsletter Manager</Typography>
                    <Box>
                         <Tooltip title="Settings">
                            <IconButton size="small" onClick={handleOpenSettings}>
                                <SettingsIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Button
                    variant="contained"
                    fullWidth
                    endIcon={saved ? <CheckCircleIcon /> : <BookmarkAddIcon />}
                    onClick={handleSavePage}
                    color={saved ? "success" : "primary"}
                >
                    {saved ? "Saved to Inbox" : "Save Current Page"}
                </Button>

                <Stack spacing={1} sx={{ mt: 1 }}>
                     <Typography variant="caption" color="text.secondary">Recent Items</Typography>
                     {/* Mock Recents */}
                    <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="body2" noWrap>Deep Learning Weekly #42</Typography>
                    </Box>
                    <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="body2" noWrap>Finance Digest: Q3 Report</Typography>
                    </Box>
                </Stack>

                <Button
                    variant="outlined"
                    fullWidth
                    endIcon={<OpenInNewIcon />}
                    onClick={handleOpenSidePanel}
                    sx={{ mt: 1, borderColor: 'divider', color: 'text.primary' }}
                >
                    Open Side Panel
                </Button>
            </Box>
        </ThemeProvider>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeContextProvider>
        <PopupContent />
    </ThemeContextProvider>
  </React.StrictMode>,
)
