import { BillingEngineRepository } from '../repositories/billing-engine.repository';
import { TenantsRepository } from '../../tenants/repositories/tenants.repository';
import { NoticesRepository } from '../../notices/repositories/notices.repository';
import { GenerateMonthlyChargesDto, CreatePaymentDto, QueryChargesDto, QueryPaymentsDto } from '../dto/financial-operations.dto';
export declare class BillingEngineService {
    private readonly billingRepo;
    private readonly tenantsRepo;
    private readonly noticesRepo;
    constructor(billingRepo: BillingEngineRepository, tenantsRepo: TenantsRepository, noticesRepo: NoticesRepository);
    private validateTenant;
    generateMonthlyCharges(slug: string, dto: GenerateMonthlyChargesDto): Promise<{
        success: boolean;
        message: string;
        data: {
            year: number;
            month: number;
            monthName: string;
            dryRun: boolean;
            totalProperties: number;
            activeFeeConfigs: number;
            chargesCount: number;
            totalProjectedAmount: number;
            charges: any[];
        };
    }>;
    getCharges(slug: string, filters: QueryChargesDto): Promise<{
        success: boolean;
        data: any[];
        count: number;
    }>;
    recordPayment(slug: string, dto: CreatePaymentDto): Promise<{
        success: boolean;
        message: string;
        data: {
            payment: any;
            updatedChargeId: string;
            propertyAddress: string;
            isDelinquent: boolean;
            remainingOverdueCharges: any;
        };
    }>;
    getPayments(slug: string, filters: QueryPaymentsDto): Promise<{
        success: boolean;
        data: any[];
        count: number;
    }>;
    getPropertyStatus(slug: string, propertyId: string): Promise<{
        success: boolean;
        data: {
            propertyId: string;
            totalBalanceDue: number;
            hasPendingCharges: boolean;
            pendingChargesCount: number;
            charges: any[];
            recentPayments: any[];
        };
    }>;
    getSummary(slug: string): Promise<{
        success: boolean;
        data: {
            totalCollectedMonth: number;
            paymentsCount: any;
            cashCollected: number;
            speiCollected: number;
            totalPendingAmount: number;
            totalOverdueAmount: number;
            overdueChargesCount: any;
            totalProperties: any;
            delinquentPropertiesCount: any;
            upToDatePropertiesCount: any;
        };
    }>;
}
