import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Tooltip, CircularProgress, Alert } from '@mui/material';
import UnsubscribeIcon from '@mui/icons-material/Unsubscribe';
import type { StoredNewsletter } from '../services';

const Subscriptions: React.FC = () => {
    const [senders, setSenders] = useState<{ sender: string, count: number, id: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSubscriptions();
    }, []);

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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h5" color="text.primary">
                Subscriptions
            </Typography>

            {loading && <CircularProgress sx={{ alignSelf: 'center' }} />}
            {error && <Alert severity="error">{error}</Alert>}

            {!loading && !error && senders.length === 0 && (
                <Typography color="text.secondary" align="center">
                    No subscriptions found.
                </Typography>
            )}

            <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
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
            </List>
        </Box>
    );
};

export default Subscriptions;
