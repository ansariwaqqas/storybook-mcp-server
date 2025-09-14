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
        type?: {
            summary: string;
            detail?: string;
        };
        defaultValue?: {
            summary: string;
            detail?: string;
        };
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
export declare class StorybookClient {
    private axios;
    private storybookUrl;
    private indexCache?;
    constructor(storybookUrl: string);
    getStorybookUrl(): string;
    initialize(): Promise<void>;
    private fetchIndex;
    listComponents(): Promise<Component[]>;
    listStories(componentId?: string): Promise<Story[]>;
    getStoryDetails(storyId: string): Promise<StoryDetails>;
    getComponentProps(componentId: string): Promise<ComponentProps>;
    private fetchStoryData;
}
//# sourceMappingURL=storybook-client.d.ts.map