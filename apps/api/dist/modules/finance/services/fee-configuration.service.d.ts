import { FeeConfigurationRepository } from '../repositories/fee-configuration.repository';
import { TenantsService } from '../../tenants/services/tenants.service';
import { CreateFeeConfigurationDto, UpdateFeeConfigurationDto } from '../dto/fee-configuration.dto';
export declare class FeeConfigurationService {
    private readonly feeRepo;
    private readonly tenantsService;
    constructor(feeRepo: FeeConfigurationRepository, tenantsService: TenantsService);
    private validateTenant;
    getFees(slug: string, activeOnly?: boolean): Promise<any[]>;
    getFeeById(slug: string, id: string): Promise<any>;
    createFee(slug: string, dto: CreateFeeConfigurationDto): Promise<any>;
    updateFee(slug: string, id: string, dto: UpdateFeeConfigurationDto): Promise<any>;
    deleteFee(slug: string, id: string): Promise<boolean>;
    simulateFee(slug: string, id: string): Promise<{
        feeSummary: {
            id: any;
            name: any;
            feeType: any;
            baseAmount: number;
            frequency: any;
            dueDay: any;
            graceDays: any;
            lateFeePolicy: string;
            earlyBirdPolicy: string;
        };
        projection: {
            totalPropertiesCount: number;
            projectedBaseRevenue: number;
            projectedEarlyBirdRevenue: number;
            projectedLateRevenue: number;
            averageFeePerProperty: number;
        };
        propertiesSample: {
            propertyId: any;
            address: string;
            lotSizeM2: number;
            isDelinquent: any;
            baseFee: number;
            discountAmount: number;
            earlyBirdTotal: number;
            surchargeAmount: number;
            lateTotal: number;
        }[];
    }>;
}
