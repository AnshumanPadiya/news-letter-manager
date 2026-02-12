import React from 'react';
import { Box, Typography } from '@mui/material';

const Rules: React.FC = () => {
    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Rules
            </Typography>
            <Typography variant="body1" color="text.secondary">
                Automate your newsletter organization with rules.
            </Typography>
        </Box>
    );
};

export default Rules;
