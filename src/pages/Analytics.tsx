import React from 'react';
import { Box, Typography } from '@mui/material';

const Analytics: React.FC = () => {
    return (
        <Box>
             <Typography variant="h4" component="h1" gutterBottom>
                Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
                Insights into your reading habits and subscription stats.
            </Typography>
        </Box>
    );
};

export default Analytics;
