import { NoticesService } from '../services/notices.service';
import { CreateNoticeDto, UpdateNoticeDto } from '../dto/notice.dto';
export declare class NoticesController {
    private readonly noticesService;
    constructor(noticesService: NoticesService);
    getNotices(slug: string, publishedOnly?: string): Promise<{
        success: boolean;
        data: any[];
        count: number;
    }>;
    getNoticeById(slug: string, id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    createNotice(slug: string, dto: CreateNoticeDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    updateNotice(slug: string, id: string, dto: UpdateNoticeDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    deleteNotice(slug: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
