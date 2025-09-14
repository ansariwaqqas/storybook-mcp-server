#!/usr/bin/env tsx

import { StorybookClient } from './src/storybook-client';

async function testStorybookAPI() {
  const storybookUrl = 'http://localhost:6006';
  console.log(`\n🧪 Testing Storybook API with: ${storybookUrl}\n`);

  const client = new StorybookClient(storybookUrl);

  try {
    // Test 1: Initialize and connect
    console.log('1️⃣  Testing connection...');
    await client.initialize();
    console.log('✅ Successfully connected to Storybook\n');

    // Test 2: List components
    console.log('2️⃣  Listing components...');
    const components = await client.listComponents();
    console.log(`✅ Found ${components.length} components:`);
    components.forEach(c => console.log(`   - ${c.name} (${c.id})`));
    console.log();

    // Test 3: List all stories
    console.log('3️⃣  Listing all stories...');
    const allStories = await client.listStories();
    console.log(`✅ Found ${allStories.length} total stories\n`);

    // Test 4: List stories for first component
    if (components.length > 0) {
      const firstComponent = components[0];
      console.log(`4️⃣  Listing stories for component "${firstComponent.id}"...`);
      const componentStories = await client.listStories(firstComponent.id);
      console.log(`✅ Found ${componentStories.length} stories for this component:`);
      componentStories.forEach(s => console.log(`   - ${s.name} (${s.id})`));
      console.log();

      // Test 5: Get story details
      if (componentStories.length > 0) {
        const firstStory = componentStories[0];
        console.log(`5️⃣  Getting details for story "${firstStory.id}"...`);
        const details = await client.getStoryDetails(firstStory.id);
        console.log(`✅ Story details:`);
        console.log(`   - Name: ${details.name}`);
        console.log(`   - Title: ${details.title}`);
        console.log(`   - Kind: ${details.kind}`);
        console.log(`   - Has parameters: ${!!details.parameters}`);
        console.log(`   - Has args: ${!!details.args}`);
        console.log(`   - Has argTypes: ${!!details.argTypes}`);
        
        if (details.argTypes) {
          const argTypeKeys = Object.keys(details.argTypes);
          console.log(`   - ArgTypes (${argTypeKeys.length} total):`);
          argTypeKeys.slice(0, 3).forEach(key => {
            const argType = details.argTypes![key];
            console.log(`     • ${key}: ${argType.type?.name || 'unknown'}`);
          });
        }
        console.log();
      }

      // Test 6: Get component props
      console.log(`6️⃣  Getting props for component "${firstComponent.id}"...`);
      try {
        const props = await client.getComponentProps(firstComponent.id);
        const propKeys = Object.keys(props.props);
        console.log(`✅ Component has ${propKeys.length} props:`);
        if (propKeys.length > 0) {
          propKeys.forEach(key => {
            const prop = props.props[key];
            console.log(`   - ${key}: ${prop.type?.name || 'unknown'}${prop.type?.required ? ' (required)' : ''}`);
          });
        }
      } catch (error) {
        console.log(`⚠️  Could not extract props (this is normal for some component types)`);
      }
    }

    console.log('\n🎉 API tests completed successfully!\n');
    console.log('To test screenshots, run: npx puppeteer browsers install chrome');
    console.log('Then run the full test: npx tsx test-local.ts\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testStorybookAPI().catch(console.error);