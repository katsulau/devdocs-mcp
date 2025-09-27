#!/usr/bin/env node

// Simple MCP client test script
import { spawn } from 'child_process';

const mcpServer = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Test MCP initialization
const initRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {
      roots: {
        listChanged: true
      },
      sampling: {}
    },
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  }
};

console.log('Sending initialization request...');
mcpServer.stdin.write(JSON.stringify(initRequest) + '\n');

// Listen for responses
mcpServer.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  for (const line of lines) {
    try {
      const response = JSON.parse(line);
      console.log('Received response:', JSON.stringify(response, null, 2));
      
      if (response.id === 1) {
        // Initialization complete, test tools
        testTools();
      }
    } catch (e) {
      console.log('Raw output:', line);
    }
  }
});

mcpServer.stderr.on('data', (data) => {
  console.log('Server stderr:', data.toString());
});

function testTools() {
  console.log('\n--- Testing Tools ---');
  
  // Test list tools
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };
  
  console.log('Listing tools...');
  mcpServer.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  // Test search_docs tool
  setTimeout(() => {
    const searchRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'search_docs',
        arguments: {
          query: 'array',
          language: 'javascript'
        }
      }
    };
    
    console.log('Testing search_docs...');
    mcpServer.stdin.write(JSON.stringify(searchRequest) + '\n');
  }, 1000);
  
  // Test download_docs tool
  setTimeout(() => {
    const downloadRequest = {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'download_docs',
        arguments: {
          language: 'javascript'
        }
      }
    };
    
    console.log('Testing download_docs...');
    mcpServer.stdin.write(JSON.stringify(downloadRequest) + '\n');
  }, 2000);
  
  // Close after tests
  setTimeout(() => {
    console.log('\n--- Tests Complete ---');
    mcpServer.kill();
    process.exit(0);
  }, 5000);
}

mcpServer.on('close', (code) => {
  console.log(`MCP server exited with code ${code}`);
});
