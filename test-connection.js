#!/usr/bin/env node

// Test DevDocs connectivity from MCP server container
async function testDevDocsConnection() {
  const baseUrl = process.env.DEVDOCS_BASE_URL || 'http://devdocs:9292';
  
  console.log(`Testing connection to: ${baseUrl}`);
  
  try {
    // Test basic connectivity
    const response = await fetch(`${baseUrl}/docs.json`);
    console.log(`Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Found ${Object.keys(data).length} available documentations`);
      console.log('Sample entries:', Object.keys(data).slice(0, 5));
    } else {
      console.log(`Error: ${response.statusText}`);
    }
  } catch (error) {
    console.log(`Connection failed: ${error.message}`);
  }
}

testDevDocsConnection();

