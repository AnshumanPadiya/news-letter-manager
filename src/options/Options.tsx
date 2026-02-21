import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  IconButton,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const PageContainer = styled(Container)`
    padding-top: ${({ theme }) => theme.spacing(4)};
    padding-bottom: ${({ theme }) => theme.spacing(4)};
`;

const HeaderRow = styled(Box)`
    display: flex;
    align-items: center;
    margin-bottom: ${({ theme }) => theme.spacing(3)};
`;

const BackButton = styled(IconButton)`
    margin-right: ${({ theme }) => theme.spacing(2)};
`;

const SettingsCard = styled(Paper)`
    padding: ${({ theme }) => theme.spacing(3)};
`;

const FormStack = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(3)};
    margin-top: ${({ theme }) => theme.spacing(3)};
`;

const InfoAlert = styled(Alert)`
    margin-top: ${({ theme }) => theme.spacing(1)};
`;

const SaveRow = styled(Box)`
    margin-top: ${({ theme }) => theme.spacing(2)};
`;

const Options: React.FC = () => {
  const navigate = useNavigate();
  const [day, setDay] = useState<string>('0');
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    chrome.storage.sync.get(['scheduleDay', 'openaiApiKey', 'geminiApiKey'], (items) => {
      if (items.scheduleDay) setDay(items.scheduleDay as string);
      if (items.openaiApiKey) setOpenaiApiKey(items.openaiApiKey as string);
      if (items.geminiApiKey) setGeminiApiKey(items.geminiApiKey as string);
    });
  }, []);

  const handleSave = () => {
    chrome.storage.sync.set({ scheduleDay: day, openaiApiKey, geminiApiKey }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <PageContainer maxWidth="md">
      <HeaderRow>
        <BackButton
          onClick={() => navigate('/')}
          aria-label="Go back"
        >
          <ArrowBackIcon />
        </BackButton>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Settings
        </Typography>
      </HeaderRow>

      <SettingsCard elevation={2}>
        <Typography variant="h6" gutterBottom>
          General Configuration
        </Typography>

        <FormStack>
          <FormControl fullWidth>
            <InputLabel id="schedule-label">Weekly Schedule</InputLabel>
            <Select
              labelId="schedule-label"
              value={day}
              label="Weekly Schedule"
              onChange={(e) => setDay(e.target.value)}
            >
              <MenuItem value="0">Sunday</MenuItem>
              <MenuItem value="1">Monday</MenuItem>
              <MenuItem value="2">Tuesday</MenuItem>
              <MenuItem value="3">Wednesday</MenuItem>
              <MenuItem value="4">Thursday</MenuItem>
              <MenuItem value="5">Friday</MenuItem>
              <MenuItem value="6">Saturday</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="OpenAI API Key (Optional)"
            type="password"
            value={openaiApiKey}
            onChange={(e) => setOpenaiApiKey(e.target.value)}
            placeholder="sk-..."
            fullWidth
            helperText="For GPT-3.5/GPT-4 models"
          />

          <TextField
            label="Gemini API Key (Optional)"
            type="password"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder="AIza..."
            fullWidth
            helperText="Free tier available with generous limits"
          />

          <InfoAlert severity="info">
            Fallback order: OpenAI → Gemini → Heuristics. If both fail or are missing, keyword-based categorization will be used.
          </InfoAlert>

          {saved && (
            <Alert severity="success">
              Settings saved successfully!
            </Alert>
          )}

          <SaveRow>
            <Button
              variant="contained"
              onClick={handleSave}
              size="large"
            >
              Save Settings
            </Button>
          </SaveRow>
        </FormStack>
      </SettingsCard>
    </PageContainer>
  );
};

export default Options;
