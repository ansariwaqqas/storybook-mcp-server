import { StorybookClient } from '../src/storybook-client';
import axios from 'axios';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('StorybookClient', () => {
  let client: StorybookClient;
  const storybookUrl = 'http://localhost:6006';

  const mockIndex = {
    v: 5,
    entries: {
      'button--primary': {
        id: 'button--primary',
        title: 'Components/Button',
        name: 'Primary',
        importPath: './Button.stories.js',
        type: 'story' as const,
        tags: ['story'],
      },
      'button--secondary': {
        id: 'button--secondary',
        title: 'Components/Button',
        name: 'Secondary',
        importPath: './Button.stories.js',
        type: 'story' as const,
        tags: ['story'],
      },
      'input--default': {
        id: 'input--default',
        title: 'Components/Input',
        name: 'Default',
        importPath: './Input.stories.js',
        type: 'story' as const,
        tags: ['story'],
      },
      'docs--intro': {
        id: 'docs--intro',
        title: 'Documentation/Intro',
        name: 'Introduction',
        importPath: './intro.mdx',
        type: 'docs' as const,
        tags: ['docs'],
      },
    },
  };

  beforeEach(() => {
    const mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      request: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    client = new StorybookClient(storybookUrl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct URL', () => {
      expect(client.getStorybookUrl()).toBe(storybookUrl);
    });

    it('should remove trailing slash from URL', () => {
      const clientWithSlash = new StorybookClient('http://localhost:6006/');
      expect(clientWithSlash.getStorybookUrl()).toBe('http://localhost:6006');
    });
  });

  describe('initialize', () => {
    it('should fetch index successfully', async () => {
      const axiosInstance = (mockedAxios.create as jest.Mock).mock.results[0].value;
      axiosInstance.get.mockResolvedValueOnce({ data: mockIndex });

      await client.initialize();

      expect(axiosInstance.get).toHaveBeenCalledWith('/index.json');
    });

    it('should throw error if connection fails', async () => {
      const axiosInstance = (mockedAxios.create as jest.Mock).mock.results[0].value;
      axiosInstance.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.initialize()).rejects.toThrow(
        `Failed to connect to Storybook at ${storybookUrl}`
      );
    });
  });

  describe('listComponents', () => {
    it('should return list of components', async () => {
      const axiosInstance = (mockedAxios.create as jest.Mock).mock.results[0].value;
      axiosInstance.get.mockResolvedValueOnce({ data: mockIndex });

      const components = await client.listComponents();

      expect(components).toHaveLength(2);
      expect(components).toContainEqual({
        id: 'Components/Button',
        name: 'Button',
        kind: 'Components/Button',
        children: [],
      });
      expect(components).toContainEqual({
        id: 'Components/Input',
        name: 'Input',
        kind: 'Components/Input',
        children: [],
      });
    });

    it('should exclude docs entries', async () => {
      const axiosInstance = (mockedAxios.create as jest.Mock).mock.results[0].value;
      axiosInstance.get.mockResolvedValueOnce({ data: mockIndex });

      const components = await client.listComponents();

      const docComponent = components.find((c) => c.id === 'Documentation/Intro');
      expect(docComponent).toBeUndefined();
    });
  });

  describe('listStories', () => {
    it('should return all stories when no componentId provided', async () => {
      const axiosInstance = (mockedAxios.create as jest.Mock).mock.results[0].value;
      axiosInstance.get.mockResolvedValueOnce({ data: mockIndex });
      axiosInstance.get.mockResolvedValue({ data: '' });

      const stories = await client.listStories();

      expect(stories).toHaveLength(3);
      expect(stories[0].id).toBe('button--primary');
      expect(stories[0].name).toBe('Primary');
      expect(stories[0].title).toBe('Components/Button');
    });

    it('should filter stories by componentId', async () => {
      const axiosInstance = (mockedAxios.create as jest.Mock).mock.results[0].value;
      axiosInstance.get.mockResolvedValueOnce({ data: mockIndex });
      axiosInstance.get.mockResolvedValue({ data: '' });

      const stories = await client.listStories('Components/Button');

      expect(stories).toHaveLength(2);
      expect(stories.every((s) => s.title === 'Components/Button')).toBe(true);
    });

    it('should include story data when available', async () => {
      const axiosInstance = (mockedAxios.create as jest.Mock).mock.results[0].value;
      axiosInstance.get.mockResolvedValueOnce({ data: mockIndex });
      
      const mockStoryData = {
        parameters: { docs: { description: 'Test story' } },
        args: { label: 'Click me' },
        argTypes: {
          label: {
            name: 'label',
            type: { name: 'string', required: true },
            control: { type: 'text' },
          },
        },
      };
      
      axiosInstance.get.mockImplementation((url: string) => {
        if (url.includes('iframe.html')) {
          return Promise.resolve({
            data: `<script>window.__STORYBOOK_STORY_STORE__ = {"button--primary":${JSON.stringify(mockStoryData)}};</script>`,
          });
        }
        return Promise.resolve({ data: '' });
      });

      const stories = await client.listStories('Components/Button');

      expect(stories[0].parameters).toEqual(mockStoryData.parameters);
      expect(stories[0].args).toEqual(mockStoryData.args);
      expect(stories[0].argTypes).toEqual(mockStoryData.argTypes);
    });
  });

  describe('getStoryDetails', () => {
    it('should return story details', async () => {
      const axiosInstance = (mockedAxios.create as jest.Mock).mock.results[0].value;
      axiosInstance.get.mockResolvedValueOnce({ data: mockIndex });
      axiosInstance.get.mockResolvedValueOnce({ data: '' });

      const details = await client.getStoryDetails('button--primary');

      expect(details.id).toBe('button--primary');
      expect(details.name).toBe('Primary');
      expect(details.title).toBe('Components/Button');
      expect(details.kind).toBe('Components/Button');
    });

    it('should throw error for non-existent story', async () => {
      const axiosInstance = (mockedAxios.create as jest.Mock).mock.results[0].value;
      axiosInstance.get.mockResolvedValueOnce({ data: mockIndex });

      await expect(client.getStoryDetails('non-existent')).rejects.toThrow(
        'Story with ID "non-existent" not found'
      );
    });
  });

  describe('getComponentProps', () => {
    it('should aggregate props from all component stories', async () => {
      const axiosInstance = (mockedAxios.create as jest.Mock).mock.results[0].value;
      axiosInstance.get.mockResolvedValueOnce({ data: mockIndex });
      
      const mockArgTypes = {
        label: {
          name: 'label',
          type: { name: 'string', required: true },
          control: { type: 'text' },
        },
        size: {
          name: 'size',
          type: { name: 'enum' },
          control: { type: 'select', options: ['small', 'medium', 'large'] },
        },
      };
      
      axiosInstance.get.mockImplementation((url: string) => {
        if (url.includes('iframe.html')) {
          return Promise.resolve({
            data: `<script>window.__STORYBOOK_STORY_STORE__ = {"button--primary":{"argTypes":${JSON.stringify(mockArgTypes)}}};</script>`,
          });
        }
        return Promise.resolve({ data: '' });
      });

      const props = await client.getComponentProps('Components/Button');

      expect(props.componentId).toBe('Components/Button');
      expect(props.props).toHaveProperty('label');
      expect(props.props).toHaveProperty('size');
    });

    it('should throw error if no stories found for component', async () => {
      const axiosInstance = (mockedAxios.create as jest.Mock).mock.results[0].value;
      axiosInstance.get.mockResolvedValueOnce({ data: mockIndex });

      await expect(client.getComponentProps('NonExistent/Component')).rejects.toThrow(
        'No stories found for component "NonExistent/Component"'
      );
    });
  });

  describe('fetchStoryData', () => {
    it('should parse story data from iframe HTML', async () => {
      const axiosInstance = (mockedAxios.create as jest.Mock).mock.results[0].value;
      const mockStoryData = {
        parameters: { docs: { description: 'Test' } },
        args: { label: 'Button' },
      };
      
      axiosInstance.get.mockResolvedValueOnce({
        data: `<html><script>window.__STORYBOOK_STORY_STORE__ = {"test-id":${JSON.stringify(mockStoryData)}};</script></html>`,
      });

      const data = await (client as any).fetchStoryData('test-id');

      expect(data).toEqual(mockStoryData);
    });

    it('should return null if parsing fails', async () => {
      const axiosInstance = (mockedAxios.create as jest.Mock).mock.results[0].value;
      axiosInstance.get.mockResolvedValueOnce({
        data: '<html>No story data</html>',
      });

      const data = await (client as any).fetchStoryData('test-id');

      expect(data).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      const axiosInstance = (mockedAxios.create as jest.Mock).mock.results[0].value;
      axiosInstance.get.mockRejectedValueOnce(new Error('Network error'));

      const data = await (client as any).fetchStoryData('test-id');

      expect(data).toBeNull();
    });
  });
});