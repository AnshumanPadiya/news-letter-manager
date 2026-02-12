import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Chip, Alert, CircularProgress, IconButton, Tooltip } from '@mui/material';
import UnsubscribeIcon from '@mui/icons-material/Unsubscribe';
import ArchiveIcon from '@mui/icons-material/Archive';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { StoredNewsletter, AppSettings } from '../services';

const Inbox: React.FC = () => {
    const [newsletters, setNewsletters] = useState<StoredNewsletter[]>([]);
    const [stats, setStats] = useState({ total: 0, savedTime: 0 });
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<AppSettings | null>(null);

    const loadData = React.useCallback(async () => {
        // Mock data loading for now, replace with actual calls
        chrome.runtime.sendMessage({ action: 'SEARCH_ARCHIVE', query: '' }, (response) => {
            if (response && response.results) {
                const all = response.results as StoredNewsletter[];
                const active = all.filter(n => !n.isArchived);
                setNewsletters(active);
                setStats({
                    total: all.length,
                    savedTime: Math.round(all.length * 5) // Assume 5 mins saved per newsletter
                });
            }
        });

        chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, (response) => {
            if (response && response.settings) {
                setSettings(response.settings);
            }
        });
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRunNow = async () => {
        setLoading(true);
        try {
            await chrome.runtime.sendMessage({ action: 'RUN_JOB_NOW' });
            // Reload data after run
            setTimeout(loadData, 2000);
        } finally {
            setLoading(false);
        }
    };

    const handleUnsubscribe = async (id: string) => {
        if (!confirm('Attempt to unsubscribe from this newsletter?')) return;
        chrome.runtime.sendMessage({ action: 'UNSUBSCRIBE', id }, (response) => {
            if (response.success) {
                alert('Unsubscribe request sent!');
            } else {
                alert('Could not auto-unsubscribe. Please open the email manually.');
            }
        });
    };

    const handleArchive = async (id: string) => {
        chrome.runtime.sendMessage({ action: 'ARCHIVE_NOW', id }, (response) => {
            if (response.success) {
                loadData(); // Refresh list
            }
        });
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" component="h1" fontWeight="bold">
                    Inbox
                </Typography>
                <Tooltip title="Refresh">
                    <IconButton onClick={loadData} size="small">
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Stats Overview - Compact for Side Panel */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h5" color="primary.main" fontWeight="bold">
                        {stats.total}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Processed
                    </Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h5" color="secondary.main" fontWeight="bold">
                        {stats.savedTime}m
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Time Saved
                    </Typography>
                </Paper>
            </Box>

            {/* Archiving Prompt */}
            {settings && !settings.archiveSettings.enableArchiving && (
                <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                    Enable auto-archiving in Settings to keep inbox clean.
                </Alert>
            )}

            {/* Actions */}
            <Button
                variant="contained"
                fullWidth
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                onClick={handleRunNow}
                disabled={loading}
            >
                {loading ? 'Analyzing...' : 'Run Analysis Now'}
            </Button>

            {/* Recent Newsletters */}
            <Box>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                    Latest Reads
                </Typography>

                {newsletters.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                        No new newsletters found in Inbox.
                    </Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {newsletters.slice(0, 10).map(newsletter => (
                            <Paper key={newsletter.id} variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ maxWidth: '70%' }}>
                                        {newsletter.subject}
                                    </Typography>
                                    <Chip
                                        label={newsletter.category}
                                        size="small"
                                        sx={{ height: 20, fontSize: '0.65rem' }}
                                    />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {newsletter.summary}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                    <Button
                                        size="small"
                                        startIcon={<UnsubscribeIcon fontSize="small" />}
                                        onClick={() => handleUnsubscribe(newsletter.id)}
                                        color="error"
                                        sx={{ fontSize: '0.75rem' }}
                                    >
                                        Unsub
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<ArchiveIcon fontSize="small" />}
                                        onClick={() => handleArchive(newsletter.id)}
                                        sx={{ fontSize: '0.75rem' }}
                                    >
                                        Archive
                                    </Button>
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default Inbox;
