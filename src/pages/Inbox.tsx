import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Chip, Alert, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import UnsubscribeIcon from '@mui/icons-material/Unsubscribe';
import ArchiveIcon from '@mui/icons-material/Archive';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { StoredNewsletter, AppSettings } from '../services';

const PageRoot = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(2)};
`;

const PageHeader = styled(Box)`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const StatsGrid = styled(Box)`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${({ theme }) => theme.spacing(2)};
`;

const StatCard = styled(Paper)`
    padding: ${({ theme }) => theme.spacing(2)};
`;

const ArchivingAlert = styled(Alert)`
    font-size: 0.875rem;
`;

const SectionTitle = styled(Typography)`
    margin-bottom: ${({ theme }) => theme.spacing(1)};
    font-weight: 600;
`;

const EmptyText = styled(Typography)`
    padding: ${({ theme }) => theme.spacing(4, 0)};
`;

const NewsletterList = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(2)};
`;

const NewsletterCard = styled(Paper)`
    padding: ${({ theme }) => theme.spacing(2)};
`;

const CardHeader = styled(Box)`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const SubjectText = styled(Typography)`
    max-width: 70%;
`;

const CategoryChip = styled(Chip)`
    height: 20px;
    font-size: 0.65rem;
`;

const SummaryText = styled(Typography)`
    margin-bottom: ${({ theme }) => theme.spacing(2)};
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;

const CardActions = styled(Box)`
    display: flex;
    gap: ${({ theme }) => theme.spacing(1)};
    justify-content: flex-end;
`;

const SmallButton = styled(Button)`
    font-size: 0.75rem;
`;

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
        <PageRoot>
            <PageHeader>
                <Typography variant="h5" component="h1" fontWeight="bold">
                    Inbox
                </Typography>
                <Tooltip title="Refresh">
                    <IconButton onClick={loadData} size="small">
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </PageHeader>

            {/* Stats Overview - Compact for Side Panel */}
            <StatsGrid>
                <StatCard variant="outlined">
                    <Typography variant="h5" color="primary.main" fontWeight="bold">
                        {stats.total}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Processed
                    </Typography>
                </StatCard>
                <StatCard variant="outlined">
                    <Typography variant="h5" color="secondary.main" fontWeight="bold">
                        {stats.savedTime}m
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Time Saved
                    </Typography>
                </StatCard>
            </StatsGrid>

            {/* Archiving Prompt */}
            {settings && !settings.archiveSettings.enableArchiving && (
                <ArchivingAlert severity="info">
                    Enable auto-archiving in Settings to keep inbox clean.
                </ArchivingAlert>
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
                <SectionTitle variant="subtitle1">
                    Latest Reads
                </SectionTitle>

                {newsletters.length === 0 ? (
                    <EmptyText variant="body2" color="text.secondary" align="center">
                        No new newsletters found in Inbox.
                    </EmptyText>
                ) : (
                    <NewsletterList>
                        {newsletters.slice(0, 10).map(newsletter => (
                            <NewsletterCard key={newsletter.id} variant="outlined">
                                <CardHeader>
                                    <SubjectText variant="subtitle2" fontWeight="bold" noWrap>
                                        {newsletter.subject}
                                    </SubjectText>
                                    <CategoryChip
                                        label={newsletter.category}
                                        size="small"
                                    />
                                </CardHeader>
                                <SummaryText variant="body2" color="text.secondary">
                                    {newsletter.summary}
                                </SummaryText>
                                <CardActions>
                                    <SmallButton
                                        size="small"
                                        startIcon={<UnsubscribeIcon fontSize="small" />}
                                        onClick={() => handleUnsubscribe(newsletter.id)}
                                        color="error"
                                    >
                                        Unsub
                                    </SmallButton>
                                    <SmallButton
                                        size="small"
                                        startIcon={<ArchiveIcon fontSize="small" />}
                                        onClick={() => handleArchive(newsletter.id)}
                                    >
                                        Archive
                                    </SmallButton>
                                </CardActions>
                            </NewsletterCard>
                        ))}
                    </NewsletterList>
                )}
            </Box>
        </PageRoot>
    );
};

export default Inbox;
