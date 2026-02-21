import React from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
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

const LayoutRoot = styled(Box)`
    width: 100%;
    min-height: 100vh;
    background-color: ${({ theme }) => theme.palette.background.default};
    color: ${({ theme }) => theme.palette.text.primary};
    display: flex;
    flex-direction: column;
`;

const StyledAppBar = styled(AppBar)`
    background-color: ${({ theme }) => theme.palette.background.paper};
    box-shadow: none;
`;

const TitleText = styled(Typography)`
    flex-grow: 1;
    color: ${({ theme }) => theme.palette.primary.main};
    font-weight: bold;
`;

const ThemeToggleButton = styled(IconButton)`
    color: ${({ theme }) => theme.palette.text.secondary};
    margin-right: ${({ theme }) => theme.spacing(2)};
`;

const NavIconButton = styled(IconButton, {
    shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>`
    color: ${({ active, theme }) =>
        active ? theme.palette.primary.main : theme.palette.text.secondary};
`;

const ContentArea = styled(Box)`
    padding: ${({ theme }) => theme.spacing(2)};
    flex-grow: 1;
    overflow-y: auto;
`;

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
        <LayoutRoot>
            <StyledAppBar position="static">
                <Toolbar variant="dense">
                    <TitleText variant="h6">
                        Newsletter Manager
                    </TitleText>

                    <Tooltip title={`Theme: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}>
                        <ThemeToggleButton onClick={handleThemeToggle}>
                            {getThemeIcon()}
                        </ThemeToggleButton>
                    </Tooltip>

                    <Tooltip title="Dashboard">
                        <NavIconButton
                            onClick={() => navigate('/')}
                            active={isActive('/')}
                        >
                            <DashboardIcon />
                        </NavIconButton>
                    </Tooltip>

                    <Tooltip title="Archive">
                        <NavIconButton
                            onClick={() => navigate('/archive')}
                            active={isActive('/archive')}
                        >
                            <ArchiveIcon />
                        </NavIconButton>
                    </Tooltip>

                    <Tooltip title="Subscriptions">
                        <NavIconButton
                            onClick={() => navigate('/subscriptions')}
                            active={isActive('/subscriptions')}
                        >
                            <UnsubscribeIcon />
                        </NavIconButton>
                    </Tooltip>

                    <Tooltip title="Settings">
                        <NavIconButton
                            onClick={() => navigate('/settings')}
                            active={isActive('/settings')}
                        >
                            <SettingsIcon />
                        </NavIconButton>
                    </Tooltip>
                </Toolbar>
            </StyledAppBar>

            <ContentArea>
                {children}
            </ContentArea>
        </LayoutRoot>
    );
};

export default Layout;
