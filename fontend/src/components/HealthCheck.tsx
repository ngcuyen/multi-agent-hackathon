import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  Chip,
  CircularProgress 
} from '@mui/material';
import { CheckCircle, Error, Refresh } from '@mui/icons-material';
import { healthAPI } from '../services/api';

interface HealthStatus {
  status: 'checking' | 'healthy' | 'error';
  message: string;
  timestamp?: string;
}

const HealthCheck: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'checking',
    message: 'Checking backend connection...'
  });

  const checkBackendHealth = async () => {
    setHealth({ status: 'checking', message: 'Checking backend connection...' });
    
    try {
      const response = await healthAPI.checkHealth();
      if (response.success && response.data) {
        setHealth({
          status: 'healthy',
          message: 'Backend is running and healthy',
          timestamp: response.data.timestamp
        });
      } else {
        setHealth({
          status: 'error',
          message: 'Backend responded but with error status'
        });
      }
    } catch (error: unknown) {
      setHealth({
        status: 'error',
        message: `Failed to connect to backend: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy': return <CheckCircle />;
      case 'error': return <Error />;
      default: return <CircularProgress size={20} />;
    }
  };

  return (
    <Card sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Backend Health Check
        </Typography>
        
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Chip
            icon={getStatusIcon()}
            label={health.status.toUpperCase()}
            color={getStatusColor()}
            variant="outlined"
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={checkBackendHealth}
            disabled={health.status === 'checking'}
          >
            Refresh
          </Button>
        </Box>

        <Typography variant="body1" color="textSecondary" paragraph>
          {health.message}
        </Typography>

        {health.timestamp && (
          <Typography variant="caption" color="textSecondary">
            Last checked: {new Date(health.timestamp).toLocaleString()}
          </Typography>
        )}

        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Connection Details
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Backend URL: {process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Health Endpoint: /riskassessment/public/api/v1/health-check/health
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default HealthCheck;
