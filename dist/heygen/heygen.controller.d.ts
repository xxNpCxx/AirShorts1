import { HeyGenService, HeyGenVideoRequest, HeyGenVideoResponse } from "./heygen.service";
export declare class HeyGenController {
    private readonly heygenService;
    constructor(heygenService: HeyGenService);
    generateVideo(request: HeyGenVideoRequest): Promise<HeyGenVideoResponse>;
    getVideoStatus(id: string): Promise<HeyGenVideoResponse>;
}
//# sourceMappingURL=heygen.controller.d.ts.map