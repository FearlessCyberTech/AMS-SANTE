// src/components/admin/StatsCard.jsx
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  LinearProgress
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const StatsCard = ({ title, value, icon, color, subtitle, trend }) => {
  const getTrendIcon = () => {
    if (trend > 0) {
      return <TrendingUp color="success" />;
    } else if (trend < 0) {
      return <TrendingDown color="error" />;
    }
    return null;
  };
  
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <Avatar
            sx={{
              backgroundColor: `${color}.light`,
              color: `${color}.dark`,
              width: 56,
              height: 56,
              mr: 2
            }}
          >
            {icon}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            
            {subtitle && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
                {trend !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                    {getTrendIcon()}
                    <Typography
                      variant="caption"
                      color={trend > 0 ? 'success.main' : 'error.main'}
                      sx={{ ml: 0.5 }}
                    >
                      {Math.abs(trend)}%
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;