import { FeeConfigurationService } from '../services/fee-configuration.service';
import { CreateFeeConfigurationDto, UpdateFeeConfigurationDto } from '../dto/fee-configuration.dto';
export declare class FeeConfigurationController {
    private readonly feeService;
    constructor(feeService: FeeConfigurationService);
    getFees(slug: string, activeOnly?: string): Promise<{
        success: boolean;
        data: any[];
        count: number;
    }>;
    getFeeById(slug: string, id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    createFee(slug: string, dto: CreateFeeConfigurationDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    updateFee(slug: string, id: string, dto: UpdateFeeConfigurationDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    deleteFee(slug: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    simulateFee(slug: string, id: string): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
}
