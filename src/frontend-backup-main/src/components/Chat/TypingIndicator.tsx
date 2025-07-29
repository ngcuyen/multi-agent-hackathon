import React from 'react';
import { Box, SpaceBetween, Badge, Spinner } from '@cloudscape-design/components';
import { Agent } from '../../types';

interface TypingIndicatorProps {
  agent: Agent;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ agent }) => {
  return (
    <div
      style={{
        padding: '12px',
        marginRight: '20%',
        backgroundColor: '#f5f5f5',
        borderRadius: '12px',
        border: '1px solid #e9ebed',
        marginBottom: '8px'
      }}
    >
      <SpaceBetween direction="horizontal" size="s" alignItems="center">
        <Badge color="green">🤖 {agent.name}</Badge>
        <Spinner size="normal" />
        <span style={{ 
          fontSize: '14px', 
          color: '#5f6b7a',
          fontStyle: 'italic'
        }}>
          is typing...
        </span>
      </SpaceBetween>
    </div>
  );
};

export default TypingIndicator;
