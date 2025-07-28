import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>VPBank K-MULT Agent Studio</h1>
        <p>Professional Multi-Agent AI System for Banking Operations</p>
        
        <div style={{ marginTop: '2rem', textAlign: 'left', maxWidth: '800px' }}>
          <h2>🏦 Banking Features</h2>
          <ul>
            <li>Multi-Agent AI System (6 specialized agents)</li>
            <li>Document Intelligence (99.5% Vietnamese OCR)</li>
            <li>Risk Assessment & Credit Scoring</li>
            <li>Banking Compliance (UCP 600, ISBP 821, SBV)</li>
            <li>Process Automation & Decision Synthesis</li>
          </ul>
          
          <h2>🔗 API Access</h2>
          <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px', color: '#333' }}>
            <p><strong>Backend API:</strong></p>
            <p><a href="http://VPBank-Backe-YzuYPJrF9vGD-169276357.us-east-1.elb.amazonaws.com:8080/docs" target="_blank" rel="noopener noreferrer">
              API Documentation
            </a></p>
            <p><a href="http://VPBank-Backe-YzuYPJrF9vGD-169276357.us-east-1.elb.amazonaws.com:8080/mutil_agent/public/api/v1/health-check/health" target="_blank" rel="noopener noreferrer">
              Health Check
            </a></p>
          </div>
          
          <h2>🎯 Multi-Agent Hackathon 2025</h2>
          <p><strong>Group 181</strong> - Production Ready Banking AI System</p>
          <p>Status: ✅ Fully Deployed on AWS</p>
        </div>
      </header>
    </div>
  );
}

export default App;
