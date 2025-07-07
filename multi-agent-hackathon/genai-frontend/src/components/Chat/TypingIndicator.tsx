import React from 'react';
import { Box, Paper, Avatar, Typography } from '@mui/material';
import { SmartToy as BotIcon } from '@mui/icons-material';
import { Agent } from '../../types';

interface TypingIndicatorProps {
  agent: Agent;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ agent }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        mb: 2,
        alignItems: 'flex-start',
        gap: 1,
      }}
    >
      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
        <BotIcon sx={{ fontSize: 18 }} />
      </Avatar>

      <Paper
        elevation={1}
        sx={{
          p: 2,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          borderTopLeftRadius: 0,
          minWidth: '100px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {agent.name} is typing
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  animation: 'typing 1.4s infinite',
                  animationDelay: `${i * 0.2}s`,
                  '@keyframes typing': {
                    '0%, 60%, 100%': {
                      transform: 'translateY(0)',
                      opacity: 0.5,
                    },
                    '30%': {
                      transform: 'translateY(-10px)',
                      opacity: 1,
                    },
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default TypingIndicator;
