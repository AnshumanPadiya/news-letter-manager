import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Link,
    Chip
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';

const Popup: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [nextRun, setNextRun] = useState<string>('Loading...');
    const [pendingCleanup, setPendingCleanup] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        // Get Next Run
        chrome.runtime.sendMessage({ action: 'GET_NEXT_RUN' }, (response) => {
            if (response && response.time) {
                setNextRun(new Date(response.time).toLocaleString());
            } else {
                setNextRun('Not scheduled');
            }
        });

        // Check for Pending Cleanup
        chrome.storage.local.get(['pendingCleanupIds'], (items) => {
            if (items.pendingCleanupIds && Array.isArray(items.pendingCleanupIds)) {
                setPendingCleanup(items.pendingCleanupIds.length);
            }
        });
    }, []);

    const handleRunNow = async () => {
        setStatus('running');
        setErrorMessage('');
        try {
            const response = await chrome.runtime.sendMessage({ action: 'RUN_JOB_NOW' });
            if (response.success) {
                setStatus('success');
                // Refresh pending cleanup count
                chrome.storage.local.get(['pendingCleanupIds'], (items) => {
                    if (items.pendingCleanupIds && Array.isArray(items.pendingCleanupIds)) {
                        setPendingCleanup(items.pendingCleanupIds.length);
                    }
                });
            } else {
                setStatus('error');
                setErrorMessage(response.error || 'Unknown error occurred');
            }
        } catch (error) {
            setStatus('error');
            setErrorMessage('Failed to communicate with background script');
        }
    };

    const handleCleanup = async () => {
        if (!confirm(`Are you sure you want to delete ${pendingCleanup} processed emails?`)) return;

        setStatus('running');
        try {
            const response = await chrome.runtime.sendMessage({ action: 'CLEANUP_EMAILS' });
            if (response.success) {
                setPendingCleanup(0);
                setStatus('idle');
                alert(`Successfully deleted ${response.count} emails.`);
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'running': return 'info';
            case 'success': return 'success';
            case 'error': return 'error';
            default: return 'default';
        }
    };

    const getStatusLabel = () => {
        switch (status) {
            case 'idle': return 'Ready';
            case 'running': return 'Processing...';
            case 'success': return 'Done!';
            case 'error': return 'Failed';
        }
    };

    return (
        <Box sx={{ width: '100%', height: '100%', p: 3, bgcolor: 'background.default' }}>
            <Typography variant="h5" component="h1" gutterBottom fontWeight="bold" color="primary">
                Newsletter Manager
            </Typography>

            <Paper elevation={2} sx={{ p: 2.5, mb: 2 }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Next Run:{' '}
                        <Typography component="span" variant="body2" fontWeight="medium" color="text.primary">
                            {nextRun}
                        </Typography>
                    </Typography>
                </Box>

                <Box sx={{ mb: 2.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'inline' }}>
                        Status:{' '}
                    </Typography>
                    <Chip
                        label={getStatusLabel()}
                        color={getStatusColor()}
                        size="small"
                        icon={status === 'running' ? <CircularProgress size={14} color="inherit" /> : undefined}
                    />
                </Box>

                {status === 'error' && errorMessage && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errorMessage}
                    </Alert>
                )}

                {status === 'success' && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Analysis complete! Check your email for the digest.
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button
                        variant="contained"
                        onClick={handleRunNow}
                        disabled={status === 'running'}
                        endIcon={status === 'running' ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                        fullWidth
                        size="large"
                        sx={{
                            justifyContent: 'center',
                            '& .MuiButton-endIcon': {
                                position: 'absolute',
                                right: 16
                            }
                        }}
                    >
                        {status === 'running' ? 'Analyzing...' : 'Run Analysis Now'}
                    </Button>

                    {pendingCleanup > 0 && (
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleCleanup}
                            disabled={status === 'running'}
                            endIcon={<DeleteIcon />}
                            fullWidth
                            sx={{
                                justifyContent: 'center',
                                '& .MuiButton-endIcon': {
                                    position: 'absolute',
                                    right: 16
                                }
                            }}
                        >
                            Cleanup {pendingCleanup} Emails
                        </Button>
                    )}
                </Box>
            </Paper>

            <Box sx={{ textAlign: 'center' }}>
                <Link href="#/options" underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <SettingsIcon fontSize="small" />
                    Settings
                </Link>
            </Box>
        </Box>
    );
};

export default Popup;
