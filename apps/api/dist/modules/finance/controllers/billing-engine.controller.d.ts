import { BillingEngineService } from '../services/billing-engine.service';
import { GenerateMonthlyChargesDto, CreatePaymentDto, QueryChargesDto, QueryPaymentsDto } from '../dto/financial-operations.dto';
export declare class BillingEngineController {
    private readonly billingService;
    constructor(billingService: BillingEngineService);
    generateMonthlyBilling(slug: string, dto: GenerateMonthlyChargesDto): Promise<{
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
    getCharges(slug: string, query: QueryChargesDto): Promise<{
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
    recordCashPayment(slug: string, dto: CreatePaymentDto): Promise<{
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
    getPayments(slug: string, query: QueryPaymentsDto): Promise<{
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
