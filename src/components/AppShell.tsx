import React from 'react';
import { Box, AppBar, Toolbar, IconButton, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import SideNav from './SideNav';
import { useThemeContext } from '../context';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';

interface AppShellProps {
    children: React.ReactNode;
}

const ShellRoot = styled(Box)`
    display: flex;
    height: 100vh;
    background-color: ${({ theme }) => theme.palette.background.default};
    color: ${({ theme }) => theme.palette.text.primary};
`;

const MainColumn = styled(Box)`
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
`;

const TopBar = styled(AppBar)`
    border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;

const ToolbarSpacer = styled(Box)`
    flex-grow: 1;
`;

const ContentArea = styled(Box)`
    flex-grow: 1;
    padding: ${({ theme }) => theme.spacing(3)};
    overflow-y: auto;
`;

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
        <ShellRoot>
            {/* Sidebar Navigation */}
            <SideNav />

            {/* Main Content Area */}
            <MainColumn>
                {/* Top Bar (could be per-page, but global for now) */}
                 <TopBar position="static" color="transparent" elevation={0}>
                    <Toolbar variant="dense">
                        <ToolbarSpacer />
                        
                         <Tooltip title={`Theme: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}>
                            <IconButton onClick={handleThemeToggle} color="inherit">
                                {getThemeIcon()}
                            </IconButton>
                        </Tooltip>
                    </Toolbar>
                </TopBar>

                {/* Page Content */}
                <ContentArea>
                    {children}
                </ContentArea>
            </MainColumn>
        </ShellRoot>
    );
};

export default AppShell;
