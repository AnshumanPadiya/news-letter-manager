import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, TextField, InputAdornment, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { StoredNewsletter } from '../services';

const Archive: React.FC = () => {
    const [newsletters, setNewsletters] = useState<StoredNewsletter[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        loadArchive();
    }, [searchQuery]);

    const loadArchive = () => {
        chrome.runtime.sendMessage({ action: 'SEARCH_ARCHIVE', query: searchQuery }, (response) => {
            if (response && response.results) {
                setNewsletters(response.results);
            }
        });
    };

    const filteredNewsletters = newsletters.filter(n =>
        selectedCategory ? n.category === selectedCategory : true
    );

    const categories = Array.from(new Set(newsletters.map(n => n.category)));

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h5" color="text.primary">
                Archive
            </Typography>

            <TextField
                fullWidth
                placeholder="Search newsletters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                    ),
                }}
                sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-root': { color: 'text.primary' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'action.disabled' }
                }}
            />

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                    label="All"
                    onClick={() => setSelectedCategory(null)}
                    sx={{
                        bgcolor: selectedCategory === null ? 'primary.main' : 'background.paper',
                        color: selectedCategory === null ? 'background.default' : 'text.primary'
                    }}
                />
                {categories.map(cat => (
                    <Chip
                        key={cat}
                        label={cat}
                        onClick={() => setSelectedCategory(cat)}
                        sx={{
                            bgcolor: selectedCategory === cat ? 'primary.main' : 'background.paper',
                            color: selectedCategory === cat ? 'background.default' : 'text.primary'
                        }}
                    />
                ))}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredNewsletters.map(newsletter => (
                    <Paper key={newsletter.id} sx={{ p: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {newsletter.subject}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {new Date(newsletter.receivedDate).toLocaleDateString()}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {newsletter.summary}
                        </Typography>
                    </Paper>
                ))}
                {filteredNewsletters.length === 0 && (
                    <Typography color="text.secondary" align="center">
                        No newsletters found.
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default Archive;
