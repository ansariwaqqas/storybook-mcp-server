"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorybookClient = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_js_1 = require("./logger.js");
class StorybookClient {
    axios;
    storybookUrl;
    indexCache;
    constructor(storybookUrl) {
        this.storybookUrl = storybookUrl.replace(/\/$/, '');
        this.axios = axios_1.default.create({
            baseURL: this.storybookUrl,
            timeout: 30000,
        });
    }
    getStorybookUrl() {
        return this.storybookUrl;
    }
    async initialize() {
        try {
            await this.fetchIndex();
            logger_js_1.logger.info('Successfully connected to Storybook instance');
        }
        catch (error) {
            logger_js_1.logger.error('Failed to connect to Storybook:', error);
            throw new Error(`Failed to connect to Storybook at ${this.storybookUrl}. Ensure Storybook is running.`);
        }
    }
    async fetchIndex() {
        if (this.indexCache) {
            return this.indexCache;
        }
        try {
            const response = await this.axios.get('/index.json');
            this.indexCache = response.data;
            return response.data;
        }
        catch (error) {
            logger_js_1.logger.error('Failed to fetch Storybook index:', error);
            throw new Error('Failed to fetch Storybook index. Ensure Storybook is running.');
        }
    }
    async listComponents() {
        const index = await this.fetchIndex();
        const componentsMap = new Map();
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
    async listStories(componentId) {
        const index = await this.fetchIndex();
        const stories = [];
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
                    }
                    else {
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
    async getStoryDetails(storyId) {
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
    async getComponentProps(componentId) {
        const stories = await this.listStories(componentId);
        if (stories.length === 0) {
            throw new Error(`No stories found for component "${componentId}"`);
        }
        const propsMap = new Map();
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
    async fetchStoryData(storyId) {
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
                    }
                    catch {
                        logger_js_1.logger.warn(`Failed to parse iframe story data for ${storyId}`);
                    }
                }
            }
        }
        catch (error) {
            logger_js_1.logger.debug(`Could not extract enhanced story data for ${storyId}`);
        }
        return null;
    }
}
exports.StorybookClient = StorybookClient;
//# sourceMappingURL=storybook-client.js.map