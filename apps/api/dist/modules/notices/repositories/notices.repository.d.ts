import { DatabaseService } from '../../../database/database.service';
export declare class NoticesRepository {
    private readonly db;
    constructor(db: DatabaseService);
    findAllByTenant(slug: string, publishedOnly?: boolean, audience?: string): Promise<any[]>;
    findById(slug: string, id: string): Promise<any>;
    create(slug: string, data: {
        title: string;
        content: string;
        category?: string;
        priority?: string;
        targetAudience?: string;
        target_audience?: string;
        expiresAt?: string;
        expires_at?: string;
        authorName?: string;
        isPinned?: boolean;
        isPublished?: boolean;
    }): Promise<any>;
    update(slug: string, id: string, data: Partial<{
        title: string;
        content: string;
        category: string;
        priority: string;
        targetAudience: string;
        target_audience: string;
        expiresAt: string;
        expires_at: string;
        authorName: string;
        isPinned: boolean;
        isPublished: boolean;
    }>): Promise<any>;
    acknowledgeByGuard(slug: string, noticeId: string, guardUserId: string, guardName: string): Promise<any>;
    delete(slug: string, id: string): Promise<boolean>;
}
