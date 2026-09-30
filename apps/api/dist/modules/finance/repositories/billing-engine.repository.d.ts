import { DatabaseService } from '../../../database/database.service';
import { CreatePaymentDto, QueryChargesDto, QueryPaymentsDto, SubmitSpeiPaymentDto, CreateAnnualCampaignDto, AnnualCampaignQuoteDto, SubmitAnnualPaymentDto } from '../dto/financial-operations.dto';
export declare class BillingEngineRepository {
    private readonly db;
    constructor(db: DatabaseService);
    listAnnualCampaigns(slug: string): Promise<any[]>;
    createAnnualCampaign(slug: string, data: CreateAnnualCampaignDto): Promise<any>;
    getAnnualCampaignQuote(slug: string, campaignId: string, data: AnnualCampaignQuoteDto): Promise<{
        missingProperty: boolean;
        campaign?: undefined;
        property?: undefined;
        grossAmount?: undefined;
        discountAmount?: undefined;
        netAmount?: undefined;
        existingCommitment?: undefined;
    } | {
        campaign: any;
        property: any;
        grossAmount: number;
        discountAmount: number;
        netAmount: number;
        existingCommitment: any;
        missingProperty?: undefined;
    }>;
    submitAnnualPayment(slug: string, campaignId: string, data: SubmitAnnualPaymentDto, paymentMethod: 'SPEI_TRANSFER' | 'CASH'): Promise<{
        missingProperty: boolean;
        campaign?: undefined;
        property?: undefined;
        grossAmount?: undefined;
        discountAmount?: undefined;
        netAmount?: undefined;
        existingCommitment?: undefined;
    } | {
        campaign: any;
        property: any;
        grossAmount: number;
        discountAmount: number;
        netAmount: number;
        existingCommitment: any;
        missingProperty?: undefined;
    } | {
        duplicateCommitment: boolean;
        invalidAmount?: undefined;
        expectedAmount?: undefined;
        commitment?: undefined;
        quote?: undefined;
    } | {
        invalidAmount: boolean;
        expectedAmount: number;
        duplicateCommitment?: undefined;
        commitment?: undefined;
        quote?: undefined;
    } | {
        commitment: any;
        quote: {
            missingProperty: boolean;
            campaign?: undefined;
            property?: undefined;
            grossAmount?: undefined;
            discountAmount?: undefined;
            netAmount?: undefined;
            existingCommitment?: undefined;
        } | {
            campaign: any;
            property: any;
            grossAmount: number;
            discountAmount: number;
            netAmount: number;
            existingCommitment: any;
            missingProperty?: undefined;
        };
        duplicateCommitment?: undefined;
        invalidAmount?: undefined;
        expectedAmount?: undefined;
    }>;
    listAnnualCommitments(slug: string, campaignId: string): Promise<any[]>;
    reviewAnnualCommitment(slug: string, id: string, status: 'APPROVED' | 'REJECTED', reviewedByName: string, notes?: string): Promise<any>;
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
        invalidCharge: boolean;
        exceedsBalance?: undefined;
        remainingBalance?: undefined;
        payment?: undefined;
        updatedChargeId?: undefined;
        propertyAddress?: undefined;
        isDelinquent?: undefined;
        remainingOverdueCharges?: undefined;
    } | {
        exceedsBalance: boolean;
        remainingBalance: number;
        invalidCharge?: undefined;
        payment?: undefined;
        updatedChargeId?: undefined;
        propertyAddress?: undefined;
        isDelinquent?: undefined;
        remainingOverdueCharges?: undefined;
    } | {
        payment: any;
        updatedChargeId: string;
        propertyAddress: string;
        isDelinquent: boolean;
        remainingOverdueCharges: any;
        invalidCharge?: undefined;
        exceedsBalance?: undefined;
        remainingBalance?: undefined;
    }>;
    findAllPayments(slug: string, filters: QueryPaymentsDto): Promise<any[]>;
    submitSpeiPayment(slug: string, data: SubmitSpeiPaymentDto): Promise<{
        invalidCharge: boolean;
        duplicateReference?: undefined;
        payment?: undefined;
        propertyAddress?: undefined;
    } | {
        duplicateReference: boolean;
        invalidCharge?: undefined;
        payment?: undefined;
        propertyAddress?: undefined;
    } | {
        payment: any;
        propertyAddress: string;
        invalidCharge?: undefined;
        duplicateReference?: undefined;
    }>;
    reviewPayment(slug: string, id: string, status: 'APPROVED' | 'REJECTED', reviewedByName: string, notes?: string): Promise<{
        payment: any;
        propertyAddress: string;
        invalidCharge?: undefined;
        exceedsBalance?: undefined;
        remainingBalance?: undefined;
        updatedChargeId?: undefined;
        isDelinquent?: undefined;
    } | {
        invalidCharge: boolean;
        payment?: undefined;
        propertyAddress?: undefined;
        exceedsBalance?: undefined;
        remainingBalance?: undefined;
        updatedChargeId?: undefined;
        isDelinquent?: undefined;
    } | {
        exceedsBalance: boolean;
        remainingBalance: number;
        payment?: undefined;
        propertyAddress?: undefined;
        invalidCharge?: undefined;
        updatedChargeId?: undefined;
        isDelinquent?: undefined;
    } | {
        payment: any;
        updatedChargeId: any;
        propertyAddress: string;
        isDelinquent: boolean;
        invalidCharge?: undefined;
        exceedsBalance?: undefined;
        remainingBalance?: undefined;
    }>;
    getPropertyFinancialStatus(slug: string, propertyId: string): Promise<{
        propertyId: string;
        totalBalanceDue: number;
        totalCharged: number;
        totalPaid: number;
        creditBalance: number;
        accountStatus: string;
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
