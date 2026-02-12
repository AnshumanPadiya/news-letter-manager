import React from 'react';
import { Box, AppBar, Toolbar, IconButton, Tooltip } from '@mui/material';
import SideNav from './SideNav';
import { useThemeContext } from '../context';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';

interface AppShellProps {
    children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
     const { mode, setMode } = useThemeContext();

    const handleThemeToggle = () => {
        if (mode === 'light') setMode('dark');
        else if (mode === 'dark') setMode('system');
        else setMode('light');
    };

    const getThemeIcon = () => {
        switch (mode) {
            case 'light': return <LightModeIcon />;
            case 'dark': return <DarkModeIcon />;
            default: return <SettingsBrightnessIcon />;
        }
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
            {/* Sidebar Navigation */}
            <SideNav />

            {/* Main Content Area */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {/* Top Bar (could be per-page, but global for now) */}
                 <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Toolbar variant="dense">
                        <Box sx={{ flexGrow: 1 }} />
                        
                         <Tooltip title={`Theme: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}>
                            <IconButton onClick={handleThemeToggle} color="inherit">
                                {getThemeIcon()}
                            </IconButton>
                        </Tooltip>
                    </Toolbar>
                </AppBar>

                {/* Page Content */}
                <Box component="main" sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

export default AppShell;
