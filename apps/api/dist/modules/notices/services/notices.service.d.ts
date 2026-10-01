import { NoticesRepository } from '../repositories/notices.repository';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { CreateNoticeDto, UpdateNoticeDto } from '../dto/notice.dto';
export declare class NoticesService {
    private readonly noticesRepo;
    private readonly tenantsRepo;
    constructor(noticesRepo: NoticesRepository, tenantsRepo: TenantsRepository);
    private validateTenant;
    getTenantNotices(slug: string, publishedOnly?: boolean, audience?: string): Promise<any[]>;
    getNoticeById(slug: string, id: string): Promise<any>;
    createTenantNotice(slug: string, dto: CreateNoticeDto): Promise<any>;
    updateTenantNotice(slug: string, id: string, dto: UpdateNoticeDto): Promise<any>;
    acknowledgeNoticeByGuard(slug: string, id: string, guardUserId: string): Promise<any>;
    deleteTenantNotice(slug: string, id: string): Promise<{
        message: string;
    }>;
}
