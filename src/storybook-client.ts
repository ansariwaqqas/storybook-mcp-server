import axios, { AxiosInstance } from 'axios';
import { logger } from './logger.js';

export interface Component {
  id: string;
  name: string;
  kind: string;
  children?: string[];
}

export interface Story {
  id: string;
  name: string;
  title: string;
  kind: string;
  componentId?: string;
  parameters?: Record<string, any>;
  args?: Record<string, any>;
  argTypes?: Record<string, ArgType>;
}

export interface ArgType {
  name: string;
  description?: string;
  type: {
    name: string;
    required?: boolean;
    value?: any;
  };
  control?: {
    type: string;
    options?: any[];
  };
  defaultValue?: any;
  table?: {
    type?: { summary: string; detail?: string };
    defaultValue?: { summary: string; detail?: string };
    category?: string;
  };
}

export interface StoryDetails {
  id: string;
  name: string;
  title: string;
  kind: string;
  parameters?: Record<string, any>;
  args?: Record<string, any>;
  argTypes?: Record<string, ArgType>;
  initialArgs?: Record<string, any>;
}

export interface ComponentProps {
  componentId: string;
  props: Record<string, ArgType>;
}

interface StorybookIndex {
  v: number;
  entries: Record<string, IndexEntry>;
}

interface IndexEntry {
  id: string;
  title: string;
  name: string;
  importPath: string;
  type: 'story' | 'docs';
  tags?: string[];
}

export class StorybookClient {
  private axios: AxiosInstance;
  private storybookUrl: string;
  private indexCache?: StorybookIndex;

  constructor(storybookUrl: string) {
    this.storybookUrl = storybookUrl.replace(/\/$/, '');
    this.axios = axios.create({
      baseURL: this.storybookUrl,
      timeout: 30000,
    });
  }

  getStorybookUrl(): string {
    return this.storybookUrl;
  }

  async initialize(): Promise<void> {
    try {
      await this.fetchIndex();
      logger.info('Successfully connected to Storybook instance');
    } catch (error) {
      logger.error('Failed to connect to Storybook:', error);
      throw new Error(
        `Failed to connect to Storybook at ${this.storybookUrl}. Ensure Storybook is running.`,
      );
    }
  }

  private async fetchIndex(): Promise<StorybookIndex> {
    if (this.indexCache) {
      return this.indexCache;
    }

    try {
      const response = await this.axios.get<StorybookIndex>('/index.json');
      this.indexCache = response.data;
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch Storybook index:', error);
      throw new Error('Failed to fetch Storybook index. Ensure Storybook is running.');
    }
  }

  async listComponents(): Promise<Component[]> {
    const index = await this.fetchIndex();
    const componentsMap = new Map<string, Component>();

    Object.values(index.entries).forEach((entry) => {
      if (entry.type === 'story') {
        const componentId = entry.title;
        if (!componentsMap.has(componentId)) {
          componentsMap.set(componentId, {
            id: componentId,
            name: componentId.split('/').pop() || componentId,
            kind: entry.title,
            children: [],
          });
        }
      }
    });

    return Array.from(componentsMap.values());
  }

  async listStories(componentId?: string): Promise<Story[]> {
    const index = await this.fetchIndex();
    const stories: Story[] = [];

    for (const [id, entry] of Object.entries(index.entries)) {
      if (entry.type === 'story') {
        if (!componentId || entry.title === componentId) {
          const story = await this.fetchStoryData(id);
          if (story) {
            stories.push({
              id,
              name: entry.name,
              title: entry.title,
              kind: entry.title,
              componentId: entry.title,
              parameters: story.parameters,
              args: story.args,
              argTypes: story.argTypes,
            });
          } else {
            stories.push({
              id,
              name: entry.name,
              title: entry.title,
              kind: entry.title,
              componentId: entry.title,
            });
          }
        }
      }
    }

    return stories;
  }

  async getStoryDetails(storyId: string): Promise<StoryDetails> {
    const index = await this.fetchIndex();
    const entry = index.entries[storyId];

    if (!entry) {
      throw new Error(`Story with ID "${storyId}" not found`);
    }

    const storyData = await this.fetchStoryData(storyId);

    return {
      id: storyId,
      name: entry.name,
      title: entry.title,
      kind: entry.title,
      parameters: storyData?.parameters,
      args: storyData?.args,
      argTypes: storyData?.argTypes,
      initialArgs: storyData?.initialArgs,
    };
  }

  async getComponentProps(componentId: string): Promise<ComponentProps> {
    const stories = await this.listStories(componentId);
    
    if (stories.length === 0) {
      throw new Error(`No stories found for component "${componentId}"`);
    }

    const propsMap = new Map<string, ArgType>();

    for (const story of stories) {
      if (story.argTypes) {
        Object.entries(story.argTypes).forEach(([key, argType]) => {
          if (!propsMap.has(key)) {
            propsMap.set(key, argType);
          }
        });
      }
    }

    return {
      componentId,
      props: Object.fromEntries(propsMap),
    };
  }

  private async fetchStoryData(storyId: string): Promise<any> {
    try {
      const iframeUrl = `/iframe.html?id=${storyId}&viewMode=story`;
      const response = await this.axios.get(iframeUrl);
      
      const argsMatch = response.data.match(/window\.__STORYBOOK_STORY_STORE__[^;]+;/);
      if (argsMatch) {
        const storeData = argsMatch[0];
        const storyDataMatch = storeData.match(new RegExp(`"${storyId}"[^}]+}`, 'g'));
        if (storyDataMatch) {
          try {
            return JSON.parse(`{${storyDataMatch[0]}}`)[storyId];
          } catch {
            logger.warn(`Failed to parse iframe story data for ${storyId}`);
          }
        }
      }
    } catch (error) {
      logger.debug(`Could not extract enhanced story data for ${storyId}`);
    }

    return null;
  }
}