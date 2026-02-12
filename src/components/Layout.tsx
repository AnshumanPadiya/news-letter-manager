import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Tooltip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnsubscribeIcon from '@mui/icons-material/Unsubscribe';
import SettingsIcon from '@mui/icons-material/Settings';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useThemeContext } from '../context';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { mode, setMode } = useThemeContext();

    const isActive = (path: string) => location.pathname === path;

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
        <Box sx={{
            width: '100%',
            minHeight: '100vh',
            bgcolor: 'background.default',
            color: 'text.primary',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <AppBar position="static" sx={{ bgcolor: 'background.paper', boxShadow: 'none' }}>
                <Toolbar variant="dense">
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 'bold' }}>
                        Newsletter Manager
                    </Typography>

                    <Tooltip title={`Theme: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}>
                        <IconButton onClick={handleThemeToggle} sx={{ color: 'text.secondary', mr: 2 }}>
                            {getThemeIcon()}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Dashboard">
                        <IconButton
                            onClick={() => navigate('/')}
                            sx={{ color: isActive('/') ? 'primary.main' : 'text.secondary' }}
                        >
                            <DashboardIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Archive">
                        <IconButton
                            onClick={() => navigate('/archive')}
                            sx={{ color: isActive('/archive') ? 'primary.main' : 'text.secondary' }}
                        >
                            <ArchiveIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Subscriptions">
                        <IconButton
                            onClick={() => navigate('/subscriptions')}
                            sx={{ color: isActive('/subscriptions') ? 'primary.main' : 'text.secondary' }}
                        >
                            <UnsubscribeIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Settings">
                        <IconButton
                            onClick={() => navigate('/settings')}
                            sx={{ color: isActive('/settings') ? 'primary.main' : 'text.secondary' }}
                        >
                            <SettingsIcon />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
                {children}
            </Box>
        </Box>
    );
};

export default Layout;
