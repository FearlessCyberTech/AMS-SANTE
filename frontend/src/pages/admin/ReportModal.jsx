// src/components/admin/ReportModal.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Chip,
  Divider,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Print as PrintIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

const ReportModal = ({ open, onClose }) => {
  const [reportType, setReportType] = useState('usage');
  const [format, setFormat] = useState('pdf');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date()
  });
  const [sections, setSections] = useState({
    users: true,
    activities: true,
    system: true,
    security: true
  });
  const [email, setEmail] = useState('');
  
  const reportTypes = [
    { value: 'usage', label: 'Utilisation système' },
    { value: 'audit', label: 'Audit de sécurité' },
    { value: 'performance', label: 'Performance' },
    { value: 'custom', label: 'Personnalisé' }
  ];
  
  const formats = [
    { value: 'pdf', label: 'PDF', icon: <AssessmentIcon /> },
    { value: 'excel', label: 'Excel', icon: <DownloadIcon /> },
    { value: 'html', label: 'HTML', icon: <AssessmentIcon /> }
  ];
  
  const handleSectionToggle = (section) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const handleGenerate = () => {
    // Génération du rapport
    console.log('Génération du rapport:', {
      reportType,
      format,
      dateRange,
      sections,
      email
    });
    
    // Simuler la génération
    setTimeout(() => {
      alert('Rapport généré avec succès');
      onClose();
    }, 2000);
  };
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Générer un rapport
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type de rapport</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  label="Type de rapport"
                >
                  {reportTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Période
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Date de début"
                    value={dateRange.start}
                    onChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Date de fin"
                    value={dateRange.end}
                    onChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Format
              </Typography>
              <ToggleButtonGroup
                value={format}
                exclusive
                onChange={(e, newFormat) => newFormat && setFormat(newFormat)}
                fullWidth
              >
                {formats.map((fmt) => (
                  <ToggleButton key={fmt.value} value={fmt.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {fmt.icon}
                      {fmt.label}
                    </Box>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>
            
            {reportType === 'custom' && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Sections à inclure
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(sections).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={key}
                      color={value ? 'primary' : 'default'}
                      onClick={() => handleSectionToggle(key)}
                      variant={value ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Envoyer par email (optionnel)"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  endAdornment: <EmailIcon />
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="info">
                Le rapport sera généré avec les paramètres sélectionnés.
                La génération peut prendre quelques minutes.
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>
            Annuler
          </Button>
          <Button
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Imprimer
          </Button>
          <LoadingButton
            variant="contained"
            startIcon={<AssessmentIcon />}
            onClick={handleGenerate}
          >
            Générer le rapport
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ReportModal;