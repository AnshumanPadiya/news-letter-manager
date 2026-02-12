import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Switch, FormControlLabel, Paper, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import type { AppSettings } from '../services';

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<AppSettings>({
        archiveSettings: { enableArchiving: false, archiveAfterDays: 30 },
        customCategories: []
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h5" color="text.primary">
                Settings
            </Typography>

            {/* API Keys */}
            <Paper sx={{ p: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
                <Typography variant="h6" gutterBottom color="primary.main">
                    AI Configuration
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="OpenAI API Key"
                        type="password"
                        value={settings.openaiKey || ''}
                        onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
                        fullWidth
                        sx={{
                            '& .MuiInputLabel-root': { color: 'text.secondary' },
                            '& .MuiOutlinedInput-root': { color: 'text.primary', '& fieldset': { borderColor: 'action.disabled' } }
                        }}
                    />
                    <TextField
                        label="Gemini API Key"
                        type="password"
                        value={settings.geminiKey || ''}
                        onChange={(e) => setSettings({ ...settings, geminiKey: e.target.value })}
                        fullWidth
                        sx={{
                            '& .MuiInputLabel-root': { color: 'text.secondary' },
                            '& .MuiOutlinedInput-root': { color: 'text.primary', '& fieldset': { borderColor: 'action.disabled' } }
                        }}
                    />
                </Box>
            </Paper>

            {/* Archiving Rules */}
            <Paper sx={{ p: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
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
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel sx={{ color: 'text.secondary' }}>Archive emails older than...</InputLabel>
                        <Select
                            value={settings.archiveSettings.archiveAfterDays}
                            label="Archive emails older than..."
                            onChange={(e) => setSettings({
                                ...settings,
                                archiveSettings: { ...settings.archiveSettings, archiveAfterDays: Number(e.target.value) }
                            })}
                            sx={{ color: 'text.primary', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'action.disabled' } }}
                        >
                            <MenuItem value={7}>1 Week</MenuItem>
                            <MenuItem value={14}>2 Weeks</MenuItem>
                            <MenuItem value={30}>1 Month</MenuItem>
                            <MenuItem value={90}>3 Months</MenuItem>
                        </Select>
                    </FormControl>
                )}
            </Paper>

            <Button
                variant="contained"
                onClick={handleSave}
                sx={{
                    bgcolor: 'primary.main',
                    color: 'background.default',
                    '&:hover': { bgcolor: 'primary.dark', color: '#fff' }
                }}
            >
                {saved ? 'Saved!' : 'Save Settings'}
            </Button>
        </Box>
    );
};

export default Settings;
