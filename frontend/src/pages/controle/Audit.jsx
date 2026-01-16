// src/pages/Administration/AuditLogs.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Chip,
  IconButton,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    user: '',
    action: '',
    dateFrom: null,
    dateTo: null,
    severity: ''
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Simulation - à remplacer par une vraie API
      const mockLogs = [
        {
          id: 1,
          timestamp: '2024-12-01 10:30:00',
          user: 'admin',
          action: 'CONNEXION',
          severity: 'INFO',
          ip: '192.168.1.1',
          details: 'Connexion réussie'
        },
        {
          id: 2,
          timestamp: '2024-12-01 09:15:00',
          user: 'medecin1',
          action: 'CONSULTATION_CREATE',
          severity: 'INFO',
          ip: '192.168.1.2',
          details: 'Création consultation #123'
        },
        {
          id: 3,
          timestamp: '2024-12-01 08:45:00',
          user: 'comptable',
          action: 'PAIEMENT_PROCESS',
          severity: 'WARNING',
          ip: '192.168.1.3',
          details: 'Paiement échoué #FAC-001'
        }
      ];
      setLogs(mockLogs);
    } catch (error) {
      console.error('Erreur chargement logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'INFO': return 'primary';
      case 'WARNING': return 'warning';
      case 'ERROR': return 'error';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const handleExport = () => {
    // Exporter les logs
    console.log('Export logs');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Logs d'audit</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadLogs}
              sx={{ mr: 2 }}
            >
              Rafraîchir
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Exporter
            </Button>
          </Box>
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Utilisateur"
                  value={filters.user}
                  onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Action</InputLabel>
                  <Select
                    value={filters.action}
                    label="Action"
                    onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    <MenuItem value="CONNEXION">Connexion</MenuItem>
                    <MenuItem value="CONSULTATION">Consultation</MenuItem>
                    <MenuItem value="PAIEMENT">Paiement</MenuItem>
                    <MenuItem value="MODIFICATION">Modification</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="Du"
                  value={filters.dateFrom}
                  onChange={(date) => setFilters({ ...filters, dateFrom: date })}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <DatePicker
                  label="Au"
                  value={filters.dateTo}
                  onChange={(date) => setFilters({ ...filters, dateTo: date })}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sévérité</InputLabel>
                  <Select
                    value={filters.severity}
                    label="Sévérité"
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    <MenuItem value="INFO">Info</MenuItem>
                    <MenuItem value="WARNING">Avertissement</MenuItem>
                    <MenuItem value="ERROR">Erreur</MenuItem>
                    <MenuItem value="CRITICAL">Critique</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date/Heure</TableCell>
                <TableCell>Utilisateur</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Sévérité</TableCell>
                <TableCell>Adresse IP</TableCell>
                <TableCell>Détails</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>{log.timestamp}</TableCell>
                  <TableCell>
                    <Chip label={log.user} size="small" />
                  </TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>
                    <Chip 
                      label={log.severity}
                      color={getSeverityColor(log.severity)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{log.ip}</TableCell>
                  <TableCell>{log.details}</TableCell>
                  <TableCell>
                    <IconButton size="small">
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </LocalizationProvider>
  );
};

export default AuditLogs;