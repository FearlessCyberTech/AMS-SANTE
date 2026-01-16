// components/ReglementChart.jsx
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from 'recharts';

const ReglementChart = ({ data, type = 'line' }) => {
  const theme = useTheme();

  // Formater les données pour le graphique
  const formattedData = data.map(item => ({
    mois: item.mois,
    transactions: item.nombre_transactions,
    montant: item.montant_total / 1000, // Convertir en milliers pour l'affichage
    montantOriginal: item.montant_total
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body2" fontWeight="bold">
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography 
              key={index} 
              variant="body2" 
              style={{ color: entry.color }}
              sx={{ mt: 0.5 }}
            >
              {entry.name === 'montant' ? 'Montant: ' : 'Transactions: '}
              {entry.name === 'montant' 
                ? `${(entry.value * 1000).toLocaleString('fr-FR')} XAF`
                : entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <Box sx={{ 
        height: 300, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: `1px dashed ${theme.palette.divider}`,
        borderRadius: 1
      }}>
        <Typography color="text.secondary">
          Aucune donnée disponible pour le graphique
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      {type === 'bar' ? (
        <BarChart
          data={formattedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis 
            dataKey="mois" 
            tick={{ fill: theme.palette.text.secondary }}
            axisLine={{ stroke: theme.palette.divider }}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fill: theme.palette.text.secondary }}
            axisLine={{ stroke: theme.palette.divider }}
            label={{ 
              value: 'Transactions', 
              angle: -90, 
              position: 'insideLeft',
              fill: theme.palette.text.secondary
            }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fill: theme.palette.text.secondary }}
            axisLine={{ stroke: theme.palette.divider }}
            label={{ 
              value: 'Montant (milliers XAF)', 
              angle: 90, 
              position: 'insideRight',
              fill: theme.palette.text.secondary
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            yAxisId="left"
            dataKey="transactions" 
            name="Nombre de transactions"
            fill={theme.palette.primary.main}
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            yAxisId="right"
            dataKey="montant" 
            name="Montant (milliers XAF)"
            fill={theme.palette.secondary.main}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      ) : (
        <LineChart
          data={formattedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis 
            dataKey="mois" 
            tick={{ fill: theme.palette.text.secondary }}
            axisLine={{ stroke: theme.palette.divider }}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fill: theme.palette.text.secondary }}
            axisLine={{ stroke: theme.palette.divider }}
            label={{ 
              value: 'Transactions', 
              angle: -90, 
              position: 'insideLeft',
              fill: theme.palette.text.secondary
            }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fill: theme.palette.text.secondary }}
            axisLine={{ stroke: theme.palette.divider }}
            label={{ 
              value: 'Montant (milliers XAF)', 
              angle: 90, 
              position: 'insideRight',
              fill: theme.palette.text.secondary
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="transactions"
            name="Nombre de transactions"
            stroke={theme.palette.primary.main}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="montant"
            name="Montant (milliers XAF)"
            stroke={theme.palette.secondary.main}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
};

export default ReglementChart;