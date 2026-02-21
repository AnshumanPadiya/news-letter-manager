import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, TextField, InputAdornment, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import type { StoredNewsletter } from '../services';

const PageRoot = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(3)};
`;

const StyledSearchField = styled(TextField)`
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.spacing(1)};

    & .MuiOutlinedInput-root {
        color: ${({ theme }) => theme.palette.text.primary};
    }

    & .MuiOutlinedInput-notchedOutline {
        border-color: ${({ theme }) => theme.palette.action.disabled};
    }
`;

const SearchAdornmentIcon = styled(SearchIcon)`
    color: ${({ theme }) => theme.palette.text.secondary};
`;

const FilterRow = styled(Box)`
    display: flex;
    gap: ${({ theme }) => theme.spacing(1)};
    flex-wrap: wrap;
`;

const FilterChip = styled(Chip)<{ active?: boolean }>`
    background-color: ${({ active, theme }) =>
        active ? theme.palette.primary.main : theme.palette.background.paper};
    color: ${({ active, theme }) =>
        active ? theme.palette.background.default : theme.palette.text.primary};
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
    margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const Archive: React.FC = () => {
    const [newsletters, setNewsletters] = useState<StoredNewsletter[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const loadArchive = React.useCallback(() => {
        chrome.runtime.sendMessage({ action: 'SEARCH_ARCHIVE', query: searchQuery }, (response) => {
            if (response && response.results) {
                setNewsletters(response.results);
            }
        });
    }, [searchQuery]);

    useEffect(() => {
        loadArchive();
    }, [loadArchive]);

    const filteredNewsletters = newsletters.filter(n =>
        selectedCategory ? n.category === selectedCategory : true
    );

    const categories = Array.from(new Set(newsletters.map(n => n.category)));

    return (
        <PageRoot>
            <Typography variant="h5" color="text.primary">
                Archive
            </Typography>

            <StyledSearchField
                fullWidth
                placeholder="Search newsletters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchAdornmentIcon />
                        </InputAdornment>
                    ),
                }}
            />

            <FilterRow>
                <FilterChip
                    label="All"
                    onClick={() => setSelectedCategory(null)}
                    active={selectedCategory === null}
                />
                {categories.map(cat => (
                    <FilterChip
                        key={cat}
                        label={cat}
                        onClick={() => setSelectedCategory(cat)}
                        active={selectedCategory === cat}
                    />
                ))}
            </FilterRow>

            <NewsletterList>
                {filteredNewsletters.map(newsletter => (
                    <NewsletterCard key={newsletter.id}>
                        <CardHeader>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {newsletter.subject}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {new Date(newsletter.receivedDate).toLocaleDateString()}
                            </Typography>
                        </CardHeader>
                        <Typography variant="body2" color="text.secondary">
                            {newsletter.summary}
                        </Typography>
                    </NewsletterCard>
                ))}
                {filteredNewsletters.length === 0 && (
                    <Typography color="text.secondary" align="center">
                        No newsletters found.
                    </Typography>
                )}
            </NewsletterList>
        </PageRoot>
    );
};

export default Archive;
