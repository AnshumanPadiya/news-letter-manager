import React, { useState } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    Chip, 
    TextField, 
    Stack, 
    Slider, 
    Button, 
    Divider,
    Alert,
    CircularProgress,
    InputAdornment
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Cancel';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SecurityIcon from '@mui/icons-material/Security';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

import { useRules } from '../hooks/rules';

const LoadingContainer = styled(Box)`
    padding: ${({ theme }) => theme.spacing(4)};
    display: flex;
    justify-content: center;
`;

const PageRoot = styled(Box)`
    padding: ${({ theme }) => theme.spacing(3)};
    max-width: 800px;
    margin: 0 auto;
`;

const HeaderSection = styled(Box)`
    margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const StyledDivider = styled(Divider)`
    margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const Section = styled(Box)`
    margin-bottom: ${({ theme }) => theme.spacing(6)};
`;

const SectionHeader = styled(Box)`
    display: flex;
    align-items: center;
    margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const SectionIcon = styled(Box)`
    margin-right: ${({ theme }) => theme.spacing(1)};
    display: flex;
`;

const SectionPaper = styled(Paper)`
    padding: ${({ theme }) => theme.spacing(3)};
    border-radius: ${({ theme }) => theme.spacing(2)};
`;

const SliderRow = styled(Box)`
    display: flex;
    justify-content: space-between;
    margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const InputRow = styled(Box)`
    display: flex;
    gap: ${({ theme }) => theme.spacing(1)};
    margin-bottom: ${({ theme }) => theme.spacing(3)};
`;

const ChipContainer = styled(Box)`
    display: flex;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing(1)};
`;

const SuggestionsSection = styled(Box)`
    margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const SuggestionsHeader = styled(Typography)`
    display: flex;
    align-items: center;
`;

const StyledSecurityIcon = styled(SecurityIcon)`
    margin-right: ${({ theme }) => theme.spacing(1)};
    color: ${({ theme }) => theme.palette.text.secondary};
`;

const StyledAlert = styled(Alert)`
    margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const SuggestionsPaper = styled(Paper)`
    padding: ${({ theme }) => theme.spacing(3)};
    border-radius: ${({ theme }) => theme.spacing(2)};
    background-color: ${({ theme }) => theme.palette.action.hover};
`;

const ScanRow = styled(Box)`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const SuggestionGroup = styled(Box)`
    margin-bottom: ${({ theme }) => theme.spacing(3)};
`;

const SuggestionLabel = styled(Box)`
    display: flex;
    align-items: center;
    margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const SuggestionIcon = styled(Box)`
    margin-right: ${({ theme }) => theme.spacing(0.5)};
    display: flex;
    font-size: 18px;
`;

const ClickableChip = styled(Chip)`
    cursor: pointer;
`;

const Rules: React.FC = () => {
    const { 
        settings, 
        loading, 
        scanning, 
        suggestions, 
        spamSuggestions,
        addSender, 
        deleteSender, 
        updateSetting, 
        scanSuggestions 
    } = useRules();

    const [whitelistInput, setWhitelistInput] = useState('');
    const [blacklistInput, setBlacklistInput] = useState('');

    const handleAddSender = (type: 'whitelist' | 'blacklist') => {
        const input = type === 'whitelist' ? whitelistInput : blacklistInput;
        const setInput = type === 'whitelist' ? setWhitelistInput : setBlacklistInput;
        
        if (input) {
            addSender(type, input);
            setInput('');
        }
    };

    if (loading) {
        return <LoadingContainer><CircularProgress /></LoadingContainer>;
    }

    if (!settings) {
        return (
            <LoadingContainer>
                <Typography color="error">Failed to load settings.</Typography>
            </LoadingContainer>
        );
    }

    return (
        <PageRoot>
            <HeaderSection>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Rules & Settings
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Configure how your newsletters are processed and organized.
                </Typography>
            </HeaderSection>

            <StyledDivider />

            {/* Smart Scanning Settings */}
            <Section>
                <SectionHeader>
                    <SectionIcon>
                        <AutoAwesomeIcon color="primary" />
                    </SectionIcon>
                    <Typography variant="h6" fontWeight="600">
                        Scanning Preferences
                    </Typography>
                </SectionHeader>
                
                <SectionPaper variant="outlined">
                    <Stack spacing={4}>
                        <Box>
                            <SliderRow>
                                <Typography variant="subtitle2">Emails to Scan (Max)</Typography>
                                <Typography variant="body2" color="primary" fontWeight="bold">
                                    {settings.maxEmailsToScan}
                                </Typography>
                            </SliderRow>
                            <Slider 
                                value={settings.maxEmailsToScan}
                                min={10}
                                max={200}
                                step={10}
                                onChange={(_, val) => updateSetting('maxEmailsToScan', val as number)}
                                valueLabelDisplay="auto"
                            />
                            <Typography variant="caption" color="text.secondary">
                                Higher limits process more emails but may take longer.
                            </Typography>
                        </Box>

                        <Box>
                            <SliderRow>
                                <Typography variant="subtitle2">Time Range (Days)</Typography>
                                <Typography variant="body2" color="primary" fontWeight="bold">
                                    {settings.scanTimeRangeDays} Days
                                </Typography>
                            </SliderRow>
                            <Slider 
                                value={settings.scanTimeRangeDays}
                                min={1}
                                max={30}
                                step={1}
                                onChange={(_, val) => updateSetting('scanTimeRangeDays', val as number)}
                                valueLabelDisplay="auto"
                            />
                        </Box>
                    </Stack>
                </SectionPaper>
            </Section>

            {/* Whitelist */}
            <Section>
                <SectionHeader>
                    <SectionIcon>
                        <CheckCircleIcon color="success" />
                    </SectionIcon>
                    <Typography variant="h6" fontWeight="600">
                        Always Include (Whitelist)
                    </Typography>
                </SectionHeader>
                
                <SectionPaper variant="outlined">
                    <InputRow>
                        <TextField 
                            fullWidth 
                            size="small" 
                            placeholder="Add sender email or domain..." 
                            value={whitelistInput}
                            onChange={(e) => setWhitelistInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddSender('whitelist')}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">@</InputAdornment>,
                            }}
                        />
                        <Button 
                            variant="contained" 
                            disableElevation 
                            startIcon={<AddIcon />}
                            onClick={() => handleAddSender('whitelist')}
                            disabled={!whitelistInput}
                        >
                            Add
                        </Button>
                    </InputRow>

                    <ChipContainer>
                        {settings.whitelistedSenders?.map((sender) => (
                            <Chip 
                                key={sender} 
                                label={sender} 
                                onDelete={() => deleteSender('whitelist', sender)}
                                color="success"
                                variant="outlined"
                                deleteIcon={<DeleteIcon />}
                            />
                        ))}
                        {settings.whitelistedSenders?.length === 0 && (
                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                No senders whitelisted yet.
                            </Typography>
                        )}
                    </ChipContainer>
                </SectionPaper>
            </Section>

            {/* Blacklist */}
            <Section>
                <SectionHeader>
                    <SectionIcon>
                        <BlockIcon color="error" />
                    </SectionIcon>
                    <Typography variant="h6" fontWeight="600">
                        Always Ignore (Blacklist)
                    </Typography>
                </SectionHeader>
                
                <SectionPaper variant="outlined">
                    <InputRow>
                        <TextField 
                            fullWidth 
                            size="small" 
                            placeholder="Add sender email or domain..." 
                            value={blacklistInput}
                            onChange={(e) => setBlacklistInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddSender('blacklist')}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">@</InputAdornment>,
                            }}
                        />
                        <Button 
                            variant="contained" 
                            color="error"
                            disableElevation 
                            startIcon={<AddIcon />}
                            onClick={() => handleAddSender('blacklist')}
                            disabled={!blacklistInput}
                        >
                            Block
                        </Button>
                    </InputRow>
                    <ChipContainer>
                        {settings.blacklistedSenders?.map((sender) => (
                            <Chip 
                                key={sender} 
                                label={sender} 
                                onDelete={() => deleteSender('blacklist', sender)}
                                color="error"
                                variant="outlined"
                                deleteIcon={<DeleteIcon />}
                            />
                        ))}
                         {settings.blacklistedSenders?.length === 0 && (
                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                No senders blocked yet.
                            </Typography>
                        )}
                    </ChipContainer>
                </SectionPaper>
            </Section>

            {/* Security & Suggestions */}
            <SuggestionsSection>
                <SuggestionsHeader variant="h6" fontWeight="600" gutterBottom>
                    <StyledSecurityIcon />
                    Privacy & Suggestions
                </SuggestionsHeader>
                
                <StyledAlert severity="info">
                    Sensitive emails (e.g., from banks, password resets) and marketing/promotional emails are automatically filtered out and never processed.
                </StyledAlert>

                <SuggestionsPaper variant="outlined">
                    <ScanRow>
                        <Typography variant="subtitle2">
                            Not sure what to add?
                        </Typography>
                        <Button 
                            size="small" 
                            variant="outlined" 
                            startIcon={scanning ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
                            onClick={scanSuggestions}
                            disabled={scanning}
                        >
                            {scanning ? 'Scanning...' : 'Scan Inbox for Suggestions'}
                        </Button>
                    </ScanRow>
                    
                    {/* Newsletter Suggestions */}
                    {suggestions.length > 0 && (
                        <SuggestionGroup>
                            <SuggestionLabel>
                                <SuggestionIcon>
                                    <CheckCircleIcon color="success" fontSize="small" />
                                </SuggestionIcon>
                                <Typography variant="caption" color="success.main" fontWeight="bold">
                                    Genuine Newsletters — click to whitelist
                                </Typography>
                            </SuggestionLabel>
                            <ChipContainer>
                                {suggestions.map(s => (
                                    <ClickableChip 
                                        key={s} 
                                        label={s} 
                                        onClick={() => addSender('whitelist', s)}
                                        icon={<AddIcon />}
                                        color="success"
                                        variant="outlined"
                                        size="small"
                                    />
                                ))}
                            </ChipContainer>
                        </SuggestionGroup>
                    )}

                    {/* Spam Suggestions */}
                    {spamSuggestions.length > 0 && (
                        <Box>
                            <SuggestionLabel>
                                <SuggestionIcon>
                                    <ReportProblemIcon color="warning" fontSize="small" />
                                </SuggestionIcon>
                                <Typography variant="caption" color="warning.main" fontWeight="bold">
                                    Possible Spam — click to blacklist
                                </Typography>
                            </SuggestionLabel>
                            <ChipContainer>
                                {spamSuggestions.map(s => (
                                    <ClickableChip 
                                        key={s} 
                                        label={s} 
                                        onClick={() => addSender('blacklist', s)}
                                        icon={<BlockIcon />}
                                        color="warning"
                                        variant="outlined"
                                        size="small"
                                    />
                                ))}
                            </ChipContainer>
                        </Box>
                    )}

                    {!scanning && suggestions.length === 0 && spamSuggestions.length === 0 && (
                        <Typography variant="caption" color="text.secondary" fontStyle="italic">
                            Click "Scan Inbox" to discover newsletters and detect spam senders.
                        </Typography>
                    )}
                </SuggestionsPaper>
            </SuggestionsSection>
        </PageRoot>
    );
};

export default Rules;
