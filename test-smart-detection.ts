#!/usr/bin/env tsx

import { StorybookDetector } from './src/storybook-detector';

async function testSmartDetection() {
  console.log('\n🔍 Testing Storybook Smart Detection\n');
  
  const detector = new StorybookDetector();
  
  // Test 1: Try to find running Storybook
  console.log('1️⃣  Searching for running Storybook instances...');
  const runningConfig = await detector.detectStorybook();
  
  if (runningConfig) {
    console.log(`✅ Found running Storybook!`);
    console.log(`   URL: ${runningConfig.url}`);
    console.log(`   Project: ${runningConfig.projectPath || 'N/A'}`);
    console.log(`   Managed: ${runningConfig.isManaged ? 'Yes' : 'No'}\n`);
  } else {
    console.log('❌ No running Storybook found\n');
  }
  
  // Test 2: Try with explicit URL
  console.log('2️⃣  Testing with explicit URL (http://localhost:6006)...');
  const explicitConfig = await detector.detectStorybook('http://localhost:6006');
  
  if (explicitConfig) {
    console.log(`✅ Connected to Storybook at specified URL!`);
    console.log(`   URL: ${explicitConfig.url}\n`);
  } else {
    console.log('❌ Could not connect to http://localhost:6006\n');
  }
  
  // Test 3: Test project detection (current directory)
  console.log('3️⃣  Checking current directory for Storybook setup...');
  const projectConfig = await detector.detectStorybook(undefined, process.cwd());
  
  if (projectConfig) {
    console.log(`✅ Can launch Storybook from current directory!`);
    console.log(`   Project: ${projectConfig.projectPath}`);
    console.log(`   Would launch at: ${projectConfig.url}\n`);
  } else {
    console.log('❌ Current directory does not contain Storybook\n');
  }
  
  // Cleanup
  await detector.cleanup();
  
  console.log('🎉 Smart detection test complete!\n');
  console.log('Usage examples:');
  console.log('  # Auto-detect and connect:');
  console.log('  npm start');
  console.log('');
  console.log('  # Connect to specific URL:');
  console.log('  npm start -- --url http://localhost:9009');
  console.log('');
  console.log('  # Launch from project:');
  console.log('  npm start -- --project /path/to/storybook-project');
  console.log('');
  console.log('  # Configure via environment:');
  console.log('  STORYBOOK_URL=http://localhost:9009 npm start');
  console.log('  STORYBOOK_PROJECT=/path/to/project npm start\n');
}

testSmartDetection().catch(console.error);