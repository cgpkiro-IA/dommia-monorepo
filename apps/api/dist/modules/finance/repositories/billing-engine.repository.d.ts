import { DatabaseService } from '../../../database/database.service';
import { CreatePaymentDto, QueryChargesDto, QueryPaymentsDto } from '../dto/financial-operations.dto';
export declare class BillingEngineRepository {
    private readonly db;
    constructor(db: DatabaseService);
    generateMonthlyCharges(slug: string, year: number, month: number, dryRun?: boolean): Promise<{
        year: number;
        month: number;
        monthName: string;
        dryRun: boolean;
        totalProperties: number;
        activeFeeConfigs: number;
        chargesCount: number;
        totalProjectedAmount: number;
        charges: any[];
    }>;
    findAllCharges(slug: string, filters: QueryChargesDto): Promise<any[]>;
    findChargeById(slug: string, id: string): Promise<any>;
    recordPayment(slug: string, data: CreatePaymentDto): Promise<{
        payment: any;
        updatedChargeId: string;
        propertyAddress: string;
        isDelinquent: boolean;
        remainingOverdueCharges: any;
    }>;
    findAllPayments(slug: string, filters: QueryPaymentsDto): Promise<any[]>;
    getPropertyFinancialStatus(slug: string, propertyId: string): Promise<{
        propertyId: string;
        totalBalanceDue: number;
        hasPendingCharges: boolean;
        pendingChargesCount: number;
        charges: any[];
        recentPayments: any[];
    }>;
    getFinancialSummary(slug: string): Promise<{
        summary: {
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
