import { DatabaseService } from '../../../database/database.service';
export declare class NoticesRepository {
    private readonly db;
    constructor(db: DatabaseService);
    ensureTableExists(slug: string): Promise<void>;
    findAllByTenant(slug: string, publishedOnly?: boolean): Promise<any[]>;
    findById(slug: string, id: string): Promise<any>;
    create(slug: string, data: {
        title: string;
        content: string;
        category?: string;
        priority?: string;
        authorName?: string;
        isPinned?: boolean;
        isPublished?: boolean;
    }): Promise<any>;
    update(slug: string, id: string, data: Partial<{
        title: string;
        content: string;
        category: string;
        priority: string;
        authorName: string;
        isPinned: boolean;
        isPublished: boolean;
    }>): Promise<any>;
    delete(slug: string, id: string): Promise<boolean>;
}
