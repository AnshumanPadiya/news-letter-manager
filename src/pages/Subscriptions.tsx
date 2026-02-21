import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Tooltip, CircularProgress, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import UnsubscribeIcon from '@mui/icons-material/Unsubscribe';
import type { StoredNewsletter } from '../services';

const PageRoot = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(3)};
`;

const CenteredLoader = styled(CircularProgress)`
    align-self: center;
`;

const StyledList = styled(List)`
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.spacing(1)};
`;

const Subscriptions: React.FC = () => {
    const [senders, setSenders] = useState<{ sender: string, count: number, id: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSubscriptions = () => {
        setLoading(true);
        chrome.runtime.sendMessage({ action: 'SEARCH_ARCHIVE', query: '' }, (response) => {
            setLoading(false);
            if (response && response.results) {
                const all = response.results as StoredNewsletter[];
                // Group by sender
                const senderMap = new Map<string, { count: number, id: string }>();

                all.forEach(n => {
                    const sender = n.sender || 'Unknown Sender';
                    const current = senderMap.get(sender) || { count: 0, id: n.id };
                    senderMap.set(sender, { count: current.count + 1, id: n.id });
                });

                const senderList = Array.from(senderMap.entries()).map(([sender, data]) => ({
                    sender,
                    count: data.count,
                    id: data.id // Use the ID of the most recent email to trigger unsubscribe
                }));

                setSenders(senderList);
            } else {
                setError('Failed to load subscriptions.');
            }
        });
    };

    useEffect(() => {
        loadSubscriptions();
    }, []);

    const handleUnsubscribe = (id: string, sender: string) => {
        if (!confirm(`Are you sure you want to unsubscribe from ${sender}?`)) return;

        chrome.runtime.sendMessage({ action: 'UNSUBSCRIBE', id }, (response) => {
            if (response.success) {
                alert(`Unsubscribe request sent for ${sender}`);
            } else {
                alert('Could not auto-unsubscribe. Please open the email manually.');
            }
        });
    };

    return (
        <PageRoot>
            <Typography variant="h5" color="text.primary">
                Subscriptions
            </Typography>

            {loading && <CenteredLoader />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && senders.length === 0 && (
                <Typography color="text.secondary" align="center">
                    No subscriptions found.
                </Typography>
            )}

            <StyledList>
                {senders.map((item, index) => (
                    <ListItem key={index} divider={index < senders.length - 1}>
                        <ListItemText
                            primary={
                                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                                    {item.sender}
                                </Typography>
                            }
                            secondary={
                                <Typography variant="body2" color="text.secondary">
                                    {item.count} newsletter{item.count !== 1 ? 's' : ''} received
                                </Typography>
                            }
                        />
                        <ListItemSecondaryAction>
                            <Tooltip title="Unsubscribe">
                                <IconButton
                                    edge="end"
                                    aria-label="unsubscribe"
                                    onClick={() => handleUnsubscribe(item.id, item.sender)}
                                    color="error"
                                >
                                    <UnsubscribeIcon />
                                </IconButton>
                            </Tooltip>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </StyledList>
        </PageRoot>
    );
};

export default Subscriptions;
