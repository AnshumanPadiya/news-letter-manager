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
import { styled } from '@mui/material/styles';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';

const PopupRoot = styled(Box)`
    width: 100%;
    height: 100%;
    padding: ${({ theme }) => theme.spacing(3)};
    background-color: ${({ theme }) => theme.palette.background.default};
`;

const StatusCard = styled(Paper)`
    padding: ${({ theme }) => theme.spacing(2.5)};
    margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const InfoRow = styled(Box)`
    margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const StatusRow = styled(Box)`
    margin-bottom: ${({ theme }) => theme.spacing(2.5)};
`;

const StatusLabel = styled(Typography)`
    display: inline;
`;

const StyledAlert = styled(Alert)`
    margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const ButtonStack = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(1.5)};
`;

const ActionButton = styled(Button)`
    justify-content: center;

    & .MuiButton-endIcon {
        position: absolute;
        right: 16px;
    }
`;

const SettingsLinkBox = styled(Box)`
    text-align: center;
`;

const SettingsLink = styled(Link)`
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing(0.5)};
`;

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
        } catch {
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
        } catch {
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
        <PopupRoot>
            <Typography variant="h5" component="h1" gutterBottom fontWeight="bold" color="primary">
                Newsletter Manager
            </Typography>

            <StatusCard elevation={2}>
                <InfoRow>
                    <Typography variant="body2" color="text.secondary">
                        Next Run:{' '}
                        <Typography component="span" variant="body2" fontWeight="medium" color="text.primary">
                            {nextRun}
                        </Typography>
                    </Typography>
                </InfoRow>

                <StatusRow>
                    <StatusLabel variant="body2" color="text.secondary">
                        Status:{' '}
                    </StatusLabel>
                    <Chip
                        label={getStatusLabel()}
                        color={getStatusColor()}
                        size="small"
                        icon={status === 'running' ? <CircularProgress size={14} color="inherit" /> : undefined}
                    />
                </StatusRow>

                {status === 'error' && errorMessage && (
                    <StyledAlert severity="error">
                        {errorMessage}
                    </StyledAlert>
                )}

                {status === 'success' && (
                    <StyledAlert severity="success">
                        Analysis complete! Check your email for the digest.
                    </StyledAlert>
                )}

                <ButtonStack>
                    <ActionButton
                        variant="contained"
                        onClick={handleRunNow}
                        disabled={status === 'running'}
                        endIcon={status === 'running' ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                        fullWidth
                        size="large"
                    >
                        {status === 'running' ? 'Analyzing...' : 'Run Analysis Now'}
                    </ActionButton>

                    {pendingCleanup > 0 && (
                        <ActionButton
                            variant="contained"
                            color="error"
                            onClick={handleCleanup}
                            disabled={status === 'running'}
                            endIcon={<DeleteIcon />}
                            fullWidth
                        >
                            Cleanup {pendingCleanup} Emails
                        </ActionButton>
                    )}
                </ButtonStack>
            </StatusCard>

            <SettingsLinkBox>
                <SettingsLink href="#/options" underline="hover">
                    <SettingsIcon fontSize="small" />
                    Settings
                </SettingsLink>
            </SettingsLinkBox>
        </PopupRoot>
    );
};

export default Popup;
