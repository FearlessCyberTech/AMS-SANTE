// frontend/src/components/ReglementsReports.jsx
import React from 'react';
import {
  Paper, Box, Typography, Grid,
  Button, Select, MenuItem, FormControl,
  InputLabel, TextField, InputAdornment
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart,
  Line, PieChart, Pie, Cell
} from 'recharts';
import { Download, TrendingUp, TrendingDown } from '@mui/icons-material';

const ReglementsReports = ({ data }) => {
  const [periode, setPeriode] = React.useState('mois');
  const [typeRapport, setTypeRapport] = React.useState('transactions');

  // Données pour les graphiques
  const transactionsData = data?.tendances || [];
  const modesPaiementData = data?.modes_paiement || [];
  const statsParStatut = data?.resume || {};

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Grid container spacing={3}>
      {/* Graphique des tendances */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Évolution des transactions</Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
              >
                <MenuItem value="jour">Jour</MenuItem>
                <MenuItem value="semaine">Semaine</MenuItem>
                <MenuItem value="mois">Mois</MenuItem>
                <MenuItem value="annee">Année</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={transactionsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="montant_total" stroke="#8884d8" name="Montant total" />
              <Line type="monotone" dataKey="reussies" stroke="#82ca9d" name="Réussies" />
              <Line type="monotone" dataKey="echouees" stroke="#ff8042" name="Échouées" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Graphique en camembert des modes de paiement */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>Répartition par mode de paiement</Typography>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={modesPaiementData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.mode}: ${entry.montant_total.toLocaleString()} XAF`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="montant_total"
              >
                {modesPaiementData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value.toLocaleString()} XAF`, 'Montant']} />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Statistiques détaillées */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Statistiques détaillées</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                <Typography variant="h4" color="success.main">
                  {(statsParStatut.taux_paiement || 0).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Taux de paiement
                </Typography>
                <TrendingUp sx={{ color: 'success.main', mt: 1 }} />
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
                <Typography variant="h4" color="warning.main">
                  {(statsParStatut.taux_reussite_transactions || 0).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Taux de réussite
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#ffebee', borderRadius: 2 }}>
                <Typography variant="h4" color="error.main">
                  {Math.round(statsParStatut.delai_moyen_paiement || 0)} jours
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Délai moyen de paiement
                </Typography>
                <TrendingDown sx={{ color: 'error.main', mt: 1 }} />
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                <Typography variant="h4" color="info.main">
                  {data?.litiges?.total_litiges || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Litiges ouverts
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Tableau des transactions récentes */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Transactions récentes</Typography>
            <Button variant="outlined" startIcon={<Download />}>
              Exporter CSV
            </Button>
          </Box>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transactionsData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value.toLocaleString()} XAF`, 'Montant']} />
              <Legend />
              <Bar dataKey="montant_total" fill="#8884d8" name="Montant total" />
              <Bar dataKey="reussies" fill="#82ca9d" name="Transactions réussies" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ReglementsReports;