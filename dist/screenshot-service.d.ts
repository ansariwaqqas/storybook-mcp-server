import { Viewport } from 'puppeteer';
export interface ScreenshotOptions {
    viewport?: Viewport;
    fullPage?: boolean;
    outputDir?: string;
}
export declare class ScreenshotService {
    private browser?;
    private defaultViewport;
    private outputDir;
    constructor(outputDir?: string);
    private ensureOutputDir;
    private getBrowser;
    captureStoryScreenshot(storybookUrl: string, storyId: string, viewport?: Viewport): Promise<string>;
    captureStoryScreenshotAsBase64(storybookUrl: string, storyId: string, viewport?: Viewport): Promise<string>;
    captureAllScreenshots(storybookUrl: string, storyIds: string[], viewport?: Viewport): Promise<string[]>;
    captureAllScreenshotsAsBase64(storybookUrl: string, storyIds: string[], viewport?: Viewport): Promise<Map<string, string>>;
    captureComponentScreenshots(storybookUrl: string, _componentId: string, storyIds: string[], viewport?: Viewport): Promise<Map<string, string>>;
    captureWithMultipleViewports(storybookUrl: string, storyId: string, viewports: Viewport[]): Promise<Map<string, string>>;
    close(): Promise<void>;
}
//# sourceMappingURL=screenshot-service.d.ts.map