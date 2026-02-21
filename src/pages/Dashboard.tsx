import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Chip, Alert, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import UnsubscribeIcon from '@mui/icons-material/Unsubscribe';
import ArchiveIcon from '@mui/icons-material/Archive';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import type { StoredNewsletter, AppSettings } from '../services';

const PageRoot = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(3)};
`;

const StatsGrid = styled(Box)`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${({ theme }) => theme.spacing(2)};
`;

const StatCard = styled(Paper)`
    padding: ${({ theme }) => theme.spacing(2)};
    background-color: ${({ theme }) => theme.palette.background.paper};
    color: ${({ theme }) => theme.palette.text.primary};
`;

const ArchivingAlert = styled(Alert)`
    background-color: ${({ theme }) => theme.palette.background.paper};
    color: ${({ theme }) => theme.palette.text.primary};

    & .MuiAlert-icon {
        color: ${({ theme }) => theme.palette.primary.main};
    }
`;

const RunButton = styled(Button)`
    background-color: ${({ theme }) => theme.palette.primary.main};
    color: ${({ theme }) => theme.palette.background.default};

    &:hover {
        background-color: ${({ theme }) => theme.palette.primary.dark};
        color: #fff;
    }
`;

const SectionTitle = styled(Typography)`
    margin-bottom: ${({ theme }) => theme.spacing(2)};
    color: ${({ theme }) => theme.palette.text.primary};
`;

const NewsletterList = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(2)};
`;

const NewsletterCard = styled(Paper)`
    padding: ${({ theme }) => theme.spacing(2)};
    background-color: ${({ theme }) => theme.palette.background.paper};
    color: ${({ theme }) => theme.palette.text.primary};
`;

const CardHeader = styled(Box)`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const CategoryChip = styled(Chip)`
    background-color: ${({ theme }) => theme.palette.action.hover};
    color: ${({ theme }) => theme.palette.primary.main};
`;

const SummaryText = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.secondary};
    margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const CardActions = styled(Box)`
    display: flex;
    gap: ${({ theme }) => theme.spacing(1)};
    justify-content: flex-end;
`;

const ArchiveButton = styled(Button)`
    color: ${({ theme }) => theme.palette.primary.main};
`;

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
        <PageRoot>
            {/* Stats Overview */}
            <StatsGrid>
                <StatCard>
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {stats.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Newsletters Processed
                    </Typography>
                </StatCard>
                <StatCard>
                    <Typography variant="h4" color="secondary.main" fontWeight="bold">
                        {stats.savedTime}m
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Time Saved
                    </Typography>
                </StatCard>
            </StatsGrid>

            {/* Archiving Prompt */}
            {settings && !settings.archiveSettings.enableArchiving && (
                <ArchivingAlert severity="info">
                    Want to keep your inbox clean? Enable auto-archiving in Settings.
                </ArchivingAlert>
            )}

            {/* Actions */}
            <RunButton
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                onClick={handleRunNow}
                disabled={loading}
            >
                {loading ? 'Analyzing...' : 'Run Analysis Now'}
            </RunButton>

            {/* Recent Newsletters */}
            <Box>
                <SectionTitle variant="h6">
                    Latest Reads
                </SectionTitle>

                {newsletters.length === 0 ? (
                    <Typography color="text.secondary" align="center">
                        No new newsletters found.
                    </Typography>
                ) : (
                    <NewsletterList>
                        {newsletters.slice(0, 5).map(newsletter => (
                            <NewsletterCard key={newsletter.id}>
                                <CardHeader>
                                    <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                        {newsletter.subject}
                                    </Typography>
                                    <CategoryChip
                                        label={newsletter.category}
                                        size="small"
                                    />
                                </CardHeader>
                                <SummaryText variant="body2">
                                    {newsletter.summary}
                                </SummaryText>
                                <CardActions>
                                    <Button
                                        size="small"
                                        startIcon={<UnsubscribeIcon />}
                                        onClick={() => handleUnsubscribe(newsletter.id)}
                                        color="error"
                                    >
                                        Unsubscribe
                                    </Button>
                                    <ArchiveButton
                                        size="small"
                                        startIcon={<ArchiveIcon />}
                                        onClick={() => handleArchive(newsletter.id)}
                                    >
                                        Archive
                                    </ArchiveButton>
                                </CardActions>
                            </NewsletterCard>
                        ))}
                    </NewsletterList>
                )}
            </Box>
        </PageRoot>
    );
};

export default Dashboard;
