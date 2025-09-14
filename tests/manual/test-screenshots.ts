#!/usr/bin/env tsx

import { StorybookClient } from './src/storybook-client';
import { ScreenshotService } from './src/screenshot-service';
import { promises as fs } from 'fs';
import path from 'path';

async function testScreenshots() {
  const storybookUrl = 'http://localhost:6006';
  console.log(`\n📸 Testing Screenshot Functionality with: ${storybookUrl}\n`);

  const client = new StorybookClient(storybookUrl);
  const screenshotService = new ScreenshotService('./test-screenshots');

  try {
    // Initialize
    await client.initialize();
    console.log('✅ Connected to Storybook\n');

    // Get stories
    const stories = await client.listStories();
    console.log(`Found ${stories.length} stories total\n`);

    // Test 1: Single screenshot
    if (stories.length > 0) {
      const firstStory = stories[0];
      console.log(`📸 Test 1: Capturing screenshot of "${firstStory.name}" (${firstStory.id})...`);
      
      const screenshotPath = await screenshotService.captureStoryScreenshot(
        storybookUrl,
        firstStory.id,
        { width: 1280, height: 720 }
      );
      
      // Verify file exists
      const stats = await fs.stat(screenshotPath);
      console.log(`✅ Screenshot saved: ${screenshotPath}`);
      console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB\n`);
    }

    // Test 2: Multiple viewports
    if (stories.length > 0) {
      const story = stories[Math.min(1, stories.length - 1)]; // Get second story if available
      console.log(`📸 Test 2: Capturing multiple viewport screenshots of "${story.name}"...`);
      
      const viewports = [
        { width: 320, height: 568 },  // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 }, // Desktop
      ];
      
      const screenshots = await screenshotService.captureWithMultipleViewports(
        storybookUrl,
        story.id,
        viewports
      );
      
      console.log(`✅ Captured ${screenshots.size} viewport screenshots:`);
      for (const [viewport, filepath] of screenshots) {
        const stats = await fs.stat(filepath);
        console.log(`   - ${viewport}: ${(stats.size / 1024).toFixed(2)} KB`);
      }
      console.log();
    }

    // Test 3: Batch screenshots (first 5 stories)
    console.log(`📸 Test 3: Batch capturing first 5 stories...`);
    const storiesToCapture = stories.slice(0, 5).map(s => s.id);
    
    const batchScreenshots = await screenshotService.captureAllScreenshots(
      storybookUrl,
      storiesToCapture,
      { width: 1280, height: 720 }
    );
    
    console.log(`✅ Batch captured ${batchScreenshots.length} screenshots\n`);

    // List all screenshots
    console.log('📁 All screenshots created:');
    const files = await fs.readdir('./test-screenshots');
    for (const file of files.filter(f => f.endsWith('.png'))) {
      const filepath = path.join('./test-screenshots', file);
      const stats = await fs.stat(filepath);
      console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    }

    console.log('\n🎉 Screenshot tests completed successfully!');
    console.log('Check the ./test-screenshots directory to view the captured images.\n');
    
  } catch (error) {
    console.error('❌ Screenshot test failed:', error);
    process.exit(1);
  } finally {
    await screenshotService.close();
  }
}

testScreenshots().catch(console.error);