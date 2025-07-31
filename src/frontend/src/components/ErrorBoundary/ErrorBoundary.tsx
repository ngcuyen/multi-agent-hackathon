import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Container,
  Header,
  SpaceBetween,
  Box,
  Button,
  Alert,
  ExpandableSection,
  KeyValuePairs
} from '@cloudscape-design/components';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Container>
          <SpaceBetween direction="vertical" size="l">
            <Header
              variant="h1"
              description="An unexpected error occurred in the VPBank K-MULT Agent Studio"
            >
              Application Error
            </Header>

            <Alert
              statusIconAriaLabel="Error"
              type="error"
              header="Something went wrong"
              action={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button onClick={this.handleReset}>
                    Try Again
                  </Button>
                  <Button variant="primary" onClick={this.handleReload}>
                    Reload Application
                  </Button>
                </SpaceBetween>
              }
            >
              The application encountered an unexpected error. This is likely a temporary issue.
              You can try to continue using the application or reload the page.
            </Alert>

            <ExpandableSection headerText="Error Details" defaultExpanded={false}>
              <SpaceBetween direction="vertical" size="m">
                {this.state.error && (
                  <Box>
                    <Header variant="h3">Error Message</Header>
                    <Box padding="s" className="error-message">
                      <code>{this.state.error.message}</code>
                    </Box>
                  </Box>
                )}

                {this.state.error?.stack && (
                  <Box>
                    <Header variant="h3">Stack Trace</Header>
                    <Box padding="s" className="error-stack">
                      <pre style={{ 
                        fontSize: '12px', 
                        overflow: 'auto', 
                        maxHeight: '300px',
                        backgroundColor: '#f8f9fa',
                        padding: '10px',
                        borderRadius: '4px'
                      }}>
                        {this.state.error.stack}
                      </pre>
                    </Box>
                  </Box>
                )}

                {this.state.errorInfo && (
                  <Box>
                    <Header variant="h3">Component Stack</Header>
                    <Box padding="s" className="error-component-stack">
                      <pre style={{ 
                        fontSize: '12px', 
                        overflow: 'auto', 
                        maxHeight: '200px',
                        backgroundColor: '#f8f9fa',
                        padding: '10px',
                        borderRadius: '4px'
                      }}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </Box>
                  </Box>
                )}

                <KeyValuePairs
                  columns={2}
                  items={[
                    {
                      label: "Application",
                      value: "VPBank K-MULT Agent Studio"
                    },
                    {
                      label: "Version",
                      value: "2.0.0"
                    },
                    {
                      label: "Environment",
                      value: process.env.NODE_ENV || 'development'
                    },
                    {
                      label: "Timestamp",
                      value: new Date().toLocaleString()
                    },
                    {
                      label: "User Agent",
                      value: navigator.userAgent
                    },
                    {
                      label: "URL",
                      value: window.location.href
                    }
                  ]}
                />
              </SpaceBetween>
            </ExpandableSection>

            <Box textAlign="center">
              <SpaceBetween direction="vertical" size="s">
                <Box variant="p">
                  If this error persists, please contact the development team with the error details above.
                </Box>
                <Box variant="small" color="text-status-inactive">
                  VPBank K-MULT Agent Studio - Multi-Agent Hackathon 2025
                </Box>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
