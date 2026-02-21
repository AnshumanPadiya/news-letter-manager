import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Switch, FormControlLabel, Paper, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { AppSettings } from '../services';

const PageRoot = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(3)};
`;

const SectionCard = styled(Paper)`
    padding: ${({ theme }) => theme.spacing(2)};
    background-color: ${({ theme }) => theme.palette.background.paper};
    color: ${({ theme }) => theme.palette.text.primary};
`;

const FormStack = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledTextField = styled(TextField)`
    & .MuiInputLabel-root {
        color: ${({ theme }) => theme.palette.text.secondary};
    }

    & .MuiOutlinedInput-root {
        color: ${({ theme }) => theme.palette.text.primary};

        & fieldset {
            border-color: ${({ theme }) => theme.palette.action.disabled};
        }
    }
`;

const StyledSelect = styled(Select)`
    color: ${({ theme }) => theme.palette.text.primary};

    & .MuiOutlinedInput-notchedOutline {
        border-color: ${({ theme }) => theme.palette.action.disabled};
    }
`;

const ArchiveFormControl = styled(FormControl)`
    margin-top: ${({ theme }) => theme.spacing(2)};
`;

const StyledInputLabel = styled(InputLabel)`
    color: ${({ theme }) => theme.palette.text.secondary};
`;

const SaveButton = styled(Button)`
    background-color: ${({ theme }) => theme.palette.primary.main};
    color: ${({ theme }) => theme.palette.background.default};

    &:hover {
        background-color: ${({ theme }) => theme.palette.primary.dark};
        color: #fff;
    }
`;

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<AppSettings>({
        archiveSettings: { enableArchiving: false, archiveAfterDays: 30 },
        customCategories: [],
        whitelistedSenders: [],
        blacklistedSenders: [],
        maxEmailsToScan: 50,
        scanTimeRangeDays: 7
    });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        chrome.runtime.sendMessage({ action: 'GET_SETTINGS' }, (response) => {
            if (response && response.settings) {
                setSettings(response.settings);
            }
        });
    }, []);

    const handleSave = () => {
        chrome.runtime.sendMessage({ action: 'SAVE_SETTINGS', settings }, () => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        });
    };

    return (
        <PageRoot>
            <Typography variant="h5" color="text.primary">
                Settings
            </Typography>

            {/* API Keys */}
            <SectionCard>
                <Typography variant="h6" gutterBottom color="primary.main">
                    AI Configuration
                </Typography>
                <FormStack>
                    <StyledTextField
                        label="OpenAI API Key"
                        type="password"
                        value={settings.openaiKey || ''}
                        onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
                        fullWidth
                    />
                    <StyledTextField
                        label="Gemini API Key"
                        type="password"
                        value={settings.geminiKey || ''}
                        onChange={(e) => setSettings({ ...settings, geminiKey: e.target.value })}
                        fullWidth
                    />
                </FormStack>
            </SectionCard>

            {/* Archiving Rules */}
            <SectionCard>
                <Typography variant="h6" gutterBottom color="primary.main">
                    Auto-Archiving
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.archiveSettings.enableArchiving}
                            onChange={(e) => setSettings({
                                ...settings,
                                archiveSettings: { ...settings.archiveSettings, enableArchiving: e.target.checked }
                            })}
                            color="secondary"
                        />
                    }
                    label="Enable Auto-Archiving"
                />

                {settings.archiveSettings.enableArchiving && (
                    <ArchiveFormControl fullWidth>
                        <StyledInputLabel>Archive emails older than...</StyledInputLabel>
                        <StyledSelect
                            value={settings.archiveSettings.archiveAfterDays}
                            label="Archive emails older than..."
                            onChange={(e) => setSettings({
                                ...settings,
                                archiveSettings: { ...settings.archiveSettings, archiveAfterDays: Number(e.target.value) }
                            })}
                        >
                            <MenuItem value={7}>1 Week</MenuItem>
                            <MenuItem value={14}>2 Weeks</MenuItem>
                            <MenuItem value={30}>1 Month</MenuItem>
                            <MenuItem value={90}>3 Months</MenuItem>
                        </StyledSelect>
                    </ArchiveFormControl>
                )}
            </SectionCard>

            <SaveButton
                variant="contained"
                onClick={handleSave}
            >
                {saved ? 'Saved!' : 'Save Settings'}
            </SaveButton>
        </PageRoot>
    );
};

export default Settings;
