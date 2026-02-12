import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Chip, Alert, CircularProgress } from '@mui/material';
import UnsubscribeIcon from '@mui/icons-material/Unsubscribe';
import ArchiveIcon from '@mui/icons-material/Archive';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import type { StoredNewsletter, AppSettings } from '../services';

const Dashboard: React.FC = () => {
    const [newsletters, setNewsletters] = useState<StoredNewsletter[]>([]);
    const [stats, setStats] = useState({ total: 0, savedTime: 0 });
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<AppSettings | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
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
    };

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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Stats Overview */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Paper sx={{ p: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {stats.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Newsletters Processed
                    </Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
                    <Typography variant="h4" color="secondary.main" fontWeight="bold">
                        {stats.savedTime}m
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Time Saved
                    </Typography>
                </Paper>
            </Box>

            {/* Archiving Prompt */}
            {settings && !settings.archiveSettings.enableArchiving && (
                <Alert severity="info" sx={{ bgcolor: 'background.paper', color: 'text.primary', '& .MuiAlert-icon': { color: 'primary.main' } }}>
                    Want to keep your inbox clean? Enable auto-archiving in Settings.
                </Alert>
            )}

            {/* Actions */}
            <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                onClick={handleRunNow}
                disabled={loading}
                sx={{
                    bgcolor: 'primary.main',
                    color: 'background.default',
                    '&:hover': { bgcolor: 'primary.dark', color: '#fff' }
                }}
            >
                {loading ? 'Analyzing...' : 'Run Analysis Now'}
            </Button>

            {/* Recent Newsletters */}
            <Box>
                <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                    Latest Reads
                </Typography>

                {newsletters.length === 0 ? (
                    <Typography color="text.secondary" align="center">
                        No new newsletters found.
                    </Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {newsletters.slice(0, 5).map(newsletter => (
                            <Paper key={newsletter.id} sx={{ p: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'text.primary' }}>
                                        {newsletter.subject}
                                    </Typography>
                                    <Chip
                                        label={newsletter.category}
                                        size="small"
                                        sx={{ bgcolor: 'action.hover', color: 'primary.main' }}
                                    />
                                </Box>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                                    {newsletter.summary}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                    <Button
                                        size="small"
                                        startIcon={<UnsubscribeIcon />}
                                        onClick={() => handleUnsubscribe(newsletter.id)}
                                        color="error"
                                    >
                                        Unsubscribe
                                    </Button>
                                    <Button
                                        size="small"
                                        startIcon={<ArchiveIcon />}
                                        onClick={() => handleArchive(newsletter.id)}
                                        sx={{ color: 'primary.main' }}
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

export default Dashboard;
