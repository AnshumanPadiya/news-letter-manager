import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, TextField, InputAdornment, Chip, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import type { StoredNewsletter } from '../services';

const PageRoot = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(2)};
`;

const FilterRow = styled(Box)`
    display: flex;
    gap: ${({ theme }) => theme.spacing(1)};
    flex-wrap: wrap;
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
    margin-bottom: ${({ theme }) => theme.spacing(0.5)};
`;

const SubjectText = styled(Typography)`
    max-width: 75%;
`;

const SummaryText = styled(Typography)`
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;

const EmptyText = styled(Typography)`
    padding: ${({ theme }) => theme.spacing(4, 0)};
`;

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
        <PageRoot>
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
                <FilterRow>
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
                </FilterRow>
            )}

            <NewsletterList>
                {filteredNewsletters.map(newsletter => (
                    <NewsletterCard key={newsletter.id} variant="outlined">
                        <CardHeader>
                            <SubjectText variant="subtitle2" fontWeight="bold" noWrap>
                                {newsletter.subject}
                            </SubjectText>
                            <Typography variant="caption" color="text.secondary">
                                {new Date(newsletter.receivedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Typography>
                        </CardHeader>
                        <SummaryText variant="body2" color="text.secondary">
                            {newsletter.summary}
                        </SummaryText>
                    </NewsletterCard>
                ))}
                {filteredNewsletters.length === 0 && (
                    <EmptyText variant="body2" color="text.secondary" align="center">
                        No newsletters found.
                    </EmptyText>
                )}
            </NewsletterList>
        </PageRoot>
    );
};

export default Collections;
