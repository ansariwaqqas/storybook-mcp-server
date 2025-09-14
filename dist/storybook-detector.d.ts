import { ChildProcess } from 'child_process';
export interface StorybookConfig {
    url: string;
    projectPath?: string;
    isManaged: boolean;
    process?: ChildProcess;
}
export declare class StorybookDetector {
    private commonPorts;
    private managedProcess?;
    detectStorybook(providedUrl?: string, projectPath?: string): Promise<StorybookConfig | null>;
    private validateStorybookUrl;
    private findRunningStorybook;
    private launchStorybook;
    private findStorybookScript;
    private extractPortFromScript;
    private detectPackageManager;
    private waitForStorybook;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=storybook-detector.d.ts.map