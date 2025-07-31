import React from 'react';
import {
  Container,
  SpaceBetween,
  Box,
  Spinner,
  ProgressBar,
  StatusIndicator
} from '@cloudscape-design/components';

interface LoadingSpinnerProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
  size?: 'normal' | 'large';
  variant?: 'default' | 'centered' | 'inline';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  progress,
  showProgress = false,
  size = 'normal',
  variant = 'default'
}) => {
  const content = (
    <SpaceBetween direction="vertical" size="m">
      <Box textAlign="center">
        <Spinner size={size} />
      </Box>
      
      <Box textAlign="center">
        <StatusIndicator type="loading">
          {message}
        </StatusIndicator>
      </Box>

      {showProgress && progress !== undefined && (
        <Box>
          <ProgressBar
            value={progress}
            label={`${Math.round(progress)}%`}
            status="in-progress"
          />
        </Box>
      )}

      <Box textAlign="center" variant="small" color="text-status-inactive">
        VPBank K-MULT Agent Studio
      </Box>
    </SpaceBetween>
  );

  if (variant === 'centered') {
    return (
      <Container>
        <Box 
          textAlign="center" 
          padding={{ vertical: 'xxl', horizontal: 'l' }}
          minHeight="400px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {content}
        </Box>
      </Container>
    );
  }

  if (variant === 'inline') {
    return (
      <Box textAlign="center" padding="m">
        {content}
      </Box>
    );
  }

  return (
    <Box textAlign="center" padding="l">
      {content}
    </Box>
  );
};

export default LoadingSpinner;
