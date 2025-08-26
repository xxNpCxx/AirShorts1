import { DidService, VideoGenerationRequest, VideoGenerationResponse } from "./did.service";
export declare class DidController {
    private readonly didService;
    constructor(didService: DidService);
    generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse>;
    getVideoStatus(id: string): Promise<VideoGenerationResponse>;
}
//# sourceMappingURL=did.controller.d.ts.map