export declare class CreateNoticeDto {
    title: string;
    content: string;
    category?: string;
    priority?: string;
    targetAudience?: string;
    target_audience?: string;
    expiresAt?: string;
    expires_at?: string;
    authorName?: string;
    author_name?: string;
    isPinned?: boolean;
    is_pinned?: boolean;
    isPublished?: boolean;
    is_published?: boolean;
}
export declare class UpdateNoticeDto {
    title?: string;
    content?: string;
    category?: string;
    priority?: string;
    targetAudience?: string;
    target_audience?: string;
    expiresAt?: string;
    expires_at?: string;
    authorName?: string;
    author_name?: string;
    isPinned?: boolean;
    is_pinned?: boolean;
    isPublished?: boolean;
    is_published?: boolean;
}
export declare class AcknowledgeGuardNoticeDto {
    guardUserId?: string;
    guardName?: string;
}
