// src/components/admin/ActivityChart.jsx
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

const ActivityChart = ({ data }) => {
  const theme = useTheme();
  
  // Préparation des données pour le graphique
  const chartData = React.useMemo(() => {
    const groupedByHour = {};
    
    data.forEach(log => {
      const hour = format(new Date(log.timestamp), 'HH:00');
      if (!groupedByHour[hour]) {
        groupedByHour[hour] = {
          hour,
          total: 0,
          CREATE: 0,
          UPDATE: 0,
          DELETE: 0,
          READ: 0
        };
      }
      
      groupedByHour[hour].total += 1;
      if (log.action_type && groupedByHour[hour][log.action_type] !== undefined) {
        groupedByHour[hour][log.action_type] += 1;
      }
    });
    
    return Object.values(groupedByHour).sort((a, b) => 
      a.hour.localeCompare(b.hour)
    );
  }, [data]);
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Activité par heure
        </Typography>
        
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="hour" 
                stroke={theme.palette.text.secondary}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                label={{ 
                  value: 'Nombre d\'actions', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                name="Total"
                stroke={theme.palette.primary.main}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="CREATE"
                name="Créations"
                stroke={theme.palette.success.main}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="UPDATE"
                name="Modifications"
                stroke={theme.palette.warning.main}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="DELETE"
                name="Suppressions"
                stroke={theme.palette.error.main}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ActivityChart;