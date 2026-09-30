import { BillingEngineService } from '../services/billing-engine.service';
import { GenerateMonthlyChargesDto, CreatePaymentDto, QueryChargesDto, QueryPaymentsDto, SubmitSpeiPaymentDto, ReviewPaymentDto, CreateAnnualCampaignDto, AnnualCampaignQuoteDto, SubmitAnnualPaymentDto } from '../dto/financial-operations.dto';
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
        };
    }>;
    recordCashPayment(slug: string, dto: CreatePaymentDto): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    getPayments(slug: string, query: QueryPaymentsDto): Promise<{
        success: boolean;
        data: any[];
        count: number;
    }>;
    submitSpeiPayment(slug: string, dto: SubmitSpeiPaymentDto): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    reviewPayment(slug: string, id: string, dto: ReviewPaymentDto): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    getPropertyStatus(slug: string, propertyId: string): Promise<{
        success: boolean;
        data: {
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
    listAnnualCampaigns(slug: string): Promise<{
        success: boolean;
        data: any[];
    }>;
    createAnnualCampaign(slug: string, dto: CreateAnnualCampaignDto): Promise<{
        success: boolean;
        data: any;
    }>;
    getAnnualCampaignQuote(slug: string, campaignId: string, dto: AnnualCampaignQuoteDto): Promise<{
        success: boolean;
        data: {
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
    }>;
    submitAnnualPayment(slug: string, campaignId: string, dto: SubmitAnnualPaymentDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    recordAnnualCashPayment(slug: string, campaignId: string, dto: SubmitAnnualPaymentDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    listAnnualCommitments(slug: string, campaignId: string): Promise<{
        success: boolean;
        data: any[];
    }>;
    reviewAnnualCommitment(slug: string, id: string, dto: ReviewPaymentDto): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
}
