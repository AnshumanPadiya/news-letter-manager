import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../nav/navConfig';

const NavContainer = styled(Box)`
    width: 280px;
    height: 100%;
    border-right: 1px solid ${({ theme }) => theme.palette.divider};
    background-color: ${({ theme }) => theme.palette.background.paper};
    display: flex;
    flex-direction: column;
`;

const BrandBox = styled(Box)`
    padding: ${({ theme }) => theme.spacing(2)};
    border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;

const BrandText = styled(Box)`
    font-weight: bold;
    color: ${({ theme }) => theme.palette.primary.main};
    ${({ theme }) => theme.typography.subtitle1};
`;

const NavList = styled(List)`
    flex-grow: 1;
    padding-top: ${({ theme }) => theme.spacing(1)};
`;

const StyledListItemButton = styled(ListItemButton)`
    min-height: 48px;
    justify-content: initial;
    padding: ${({ theme }) => theme.spacing(0, 2.5)};

    &.Mui-selected {
        background-color: ${({ theme }) => theme.palette.primary.main};
        color: ${({ theme }) => theme.palette.primary.contrastText};

        &:hover {
            background-color: ${({ theme }) => theme.palette.primary.dark};
        }

        & .MuiListItemIcon-root {
            color: ${({ theme }) => theme.palette.primary.contrastText};
        }
    }
`;

const StyledListItemIcon = styled(ListItemIcon, {
    shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>`
    min-width: 0;
    margin-right: ${({ theme }) => theme.spacing(2)};
    justify-content: center;
    color: ${({ active, theme }) => (active ? 'inherit' : theme.palette.text.secondary)};
`;

const SideNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Only primary items in the rail/drawer for now
    const primaryItems = NAV_ITEMS.filter(item => item.kind === 'primary');

    return (
        <NavContainer>
            <BrandBox>
                <BrandText>
                    Newsletter Manager
                </BrandText>
            </BrandBox>

            <NavList>
                {primaryItems.map((item) => {
                    const isActive = location.pathname === item.route || (location.pathname === '/' && item.id === 'inbox');
                    return (
                        <ListItem key={item.id} disablePadding sx={{ display: 'block' }}>
                            <StyledListItemButton
                                selected={isActive}
                                onClick={() => item.route && navigate(item.route)}
                            >
                                <StyledListItemIcon active={isActive}>
                                    <item.icon />
                                </StyledListItemIcon>
                                <ListItemText primary={item.label} />
                            </StyledListItemButton>
                        </ListItem>
                    );
                })}
            </NavList>
             
             {/* Simulating secondary/bottom items if needed */}
             <Divider />
        </NavContainer>
    );
};

export default SideNav;
