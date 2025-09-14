#!/usr/bin/env tsx

import { StorybookClient } from './src/storybook-client';
import { ScreenshotService } from './src/screenshot-service';

async function testStorybookServer() {
  const storybookUrl = 'http://localhost:6006';
  console.log(`\n🧪 Testing Storybook MCP Server with: ${storybookUrl}\n`);

  const client = new StorybookClient(storybookUrl);
  const screenshotService = new ScreenshotService('./test-screenshots');

  try {
    // Test 1: Initialize and connect
    console.log('1️⃣  Testing connection...');
    await client.initialize();
    console.log('✅ Successfully connected to Storybook\n');

    // Test 2: List components
    console.log('2️⃣  Listing components...');
    const components = await client.listComponents();
    console.log(`✅ Found ${components.length} components:`);
    components.slice(0, 5).forEach(c => console.log(`   - ${c.name} (${c.id})`));
    if (components.length > 5) console.log(`   ... and ${components.length - 5} more\n`);

    // Test 3: List stories
    console.log('3️⃣  Listing stories...');
    const stories = await client.listStories();
    console.log(`✅ Found ${stories.length} stories:`);
    stories.slice(0, 5).forEach(s => console.log(`   - ${s.name} (${s.id})`));
    if (stories.length > 5) console.log(`   ... and ${stories.length - 5} more\n`);

    // Test 4: Get story details (if stories exist)
    if (stories.length > 0) {
      console.log('4️⃣  Getting story details...');
      const firstStory = stories[0];
      const details = await client.getStoryDetails(firstStory.id);
      console.log(`✅ Story details for "${details.name}":`);
      console.log(`   - Title: ${details.title}`);
      console.log(`   - Has args: ${details.args ? 'Yes' : 'No'}`);
      console.log(`   - Has argTypes: ${details.argTypes ? 'Yes' : 'No'}\n`);

      // Test 5: Get component props
      if (firstStory.componentId) {
        console.log('5️⃣  Getting component props...');
        try {
          const props = await client.getComponentProps(firstStory.componentId);
          const propKeys = Object.keys(props.props);
          console.log(`✅ Component "${props.componentId}" has ${propKeys.length} props:`);
          propKeys.slice(0, 5).forEach(key => {
            const prop = props.props[key];
            console.log(`   - ${key}: ${prop.type?.name || 'unknown'}`);
          });
          if (propKeys.length > 5) console.log(`   ... and ${propKeys.length - 5} more\n`);
        } catch (error) {
          console.log(`⚠️  Could not extract props: ${error}\n`);
        }
      }

      // Test 6: Capture screenshot
      console.log('6️⃣  Capturing screenshot of first story...');
      const screenshotPath = await screenshotService.captureStoryScreenshot(
        storybookUrl,
        firstStory.id,
        { width: 1280, height: 720 }
      );
      console.log(`✅ Screenshot saved to: ${screenshotPath}\n`);
    }

    console.log('🎉 All tests passed successfully!\n');
    console.log('You can now use this MCP server with Claude by adding it to your configuration.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await screenshotService.close();
  }
}

testStorybookServer().catch(console.error);