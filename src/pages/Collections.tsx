import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, TextField, InputAdornment, Chip, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import type { StoredNewsletter } from '../services';

const Collections: React.FC = () => {
    const [newsletters, setNewsletters] = useState<StoredNewsletter[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        const loadArchive = () => {
            chrome.runtime.sendMessage({ action: 'SEARCH_ARCHIVE', query: searchQuery }, (response) => {
                if (response && response.results) {
                    setNewsletters(response.results);
                }
            });
        };
        loadArchive();
    }, [searchQuery]);

    const filteredNewsletters = newsletters.filter(n =>
        selectedCategory ? n.category === selectedCategory : true
    );

    const categories = Array.from(new Set(newsletters.map(n => n.category)));

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h5" component="h1" fontWeight="bold">
                Collections
            </Typography>

            <TextField
                fullWidth
                size="small"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon fontSize="small" color="action" />
                        </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                        <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setSearchQuery('')}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </InputAdornment>
                    )
                }}
            />

            {categories.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                        label="All"
                        size="small"
                        onClick={() => setSelectedCategory(null)}
                        color={selectedCategory === null ? 'primary' : 'default'}
                        variant={selectedCategory === null ? 'filled' : 'outlined'}
                        clickable
                    />
                    {categories.map(cat => (
                        <Chip
                            key={cat}
                            label={cat}
                            size="small"
                            onClick={() => setSelectedCategory(cat)}
                            color={selectedCategory === cat ? 'primary' : 'default'}
                            variant={selectedCategory === cat ? 'filled' : 'outlined'}
                            clickable
                        />
                    ))}
                </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredNewsletters.map(newsletter => (
                    <Paper key={newsletter.id} variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ maxWidth: '75%' }}>
                                {newsletter.subject}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {new Date(newsletter.receivedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {newsletter.summary}
                        </Typography>
                    </Paper>
                ))}
                {filteredNewsletters.length === 0 && (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                        No newsletters found.
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default Collections;
