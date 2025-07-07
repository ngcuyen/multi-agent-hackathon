import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  SmartToy as BotIcon,
  ContentCopy as CopyIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message, Agent } from '../../types';

interface MessageBubbleProps {
  message: Message;
  agent: Agent;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, agent }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isSystem) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <Chip
          label={message.content}
          size="small"
          variant="outlined"
          color="info"
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
        alignItems: 'flex-start',
        gap: 1,
      }}
    >
      {!isUser && (
        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
          <BotIcon sx={{ fontSize: 18 }} />
        </Avatar>
      )}

      <Box sx={{ maxWidth: '70%', minWidth: '200px' }}>
        <Paper
          elevation={1}
          sx={{
            p: 2,
            backgroundColor: isUser ? 'primary.main' : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
            borderTopLeftRadius: !isUser ? 0 : 2,
            borderTopRightRadius: isUser ? 0 : 2,
          }}
        >
          {/* Message Content */}
          <Box sx={{ mb: 1 }}>
            {isUser ? (
              <Typography variant="body1">{message.content}</Typography>
            ) : (
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    return !isInline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus as any}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </Box>

          {/* Message Metadata */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                opacity: 0.7,
                color: isUser ? 'inherit' : 'text.secondary',
              }}
            >
              {formatTimestamp(message.timestamp)}
            </Typography>

            {message.metadata && (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {message.metadata.tokens && (
                  <Chip
                    label={`${message.metadata.tokens} tokens`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
                {message.metadata.cost && (
                  <Chip
                    label={`$${message.metadata.cost.toFixed(4)}`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            )}
          </Box>
        </Paper>

        {/* Action Buttons */}
        {!isUser && (
          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              mt: 0.5,
              justifyContent: 'flex-start',
            }}
          >
            <Tooltip title="Copy message">
              <IconButton size="small" onClick={handleCopy}>
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Good response">
              <IconButton size="small" color="success">
                <ThumbUpIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Poor response">
              <IconButton size="small" color="error">
                <ThumbDownIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {isUser && (
        <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
          <PersonIcon sx={{ fontSize: 18 }} />
        </Avatar>
      )}
    </Box>
  );
};

export default MessageBubble;
