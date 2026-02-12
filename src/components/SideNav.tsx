import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../nav/navConfig';

const SideNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Only primary items in the rail/drawer for now
    const primaryItems = NAV_ITEMS.filter(item => item.kind === 'primary');

    return (
        <Box sx={{
            width: 280,
            height: '100%',
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ typography: 'subtitle1', fontWeight: 'bold', color: 'primary.main' }}>
                    Newsletter Manager
                </Box>
            </Box>

            <List sx={{ flexGrow: 1, pt: 1 }}>
                {primaryItems.map((item) => {
                    const isActive = location.pathname === item.route || (location.pathname === '/' && item.id === 'inbox');
                    return (
                        <ListItem key={item.id} disablePadding sx={{ display: 'block' }}>
                            <ListItemButton
                                selected={isActive}
                                onClick={() => item.route && navigate(item.route)}
                                sx={{
                                    minHeight: 48,
                                    justifyContent: 'initial',
                                    px: 2.5,
                                    '&.Mui-selected': {
                                        bgcolor: 'primary.main',
                                        color: 'primary.contrastText',
                                        '&:hover': {
                                            bgcolor: 'primary.dark',
                                        },
                                        '& .MuiListItemIcon-root': {
                                            color: 'primary.contrastText',
                                        }
                                    }
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: 2,
                                        justifyContent: 'center',
                                        color: isActive ? 'inherit' : 'text.secondary'
                                    }}
                                >
                                    <item.icon />
                                </ListItemIcon>
                                <ListItemText primary={item.label} sx={{ opacity: 1 }} />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
             
             {/* Simulating secondary/bottom items if needed */}
             <Divider />
        </Box>
    );
};

export default SideNav;
