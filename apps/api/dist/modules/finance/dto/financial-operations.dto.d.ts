export declare class GenerateMonthlyChargesDto {
    year?: number;
    month?: number;
    dryRun?: boolean;
}
export declare class CreatePaymentDto {
    propertyId?: string;
    property_id?: string;
    chargeId?: string;
    charge_id?: string;
    amount: number;
    paymentMethod?: string;
    payment_method?: string;
    reference?: string;
    receivedByName?: string;
    received_by_name?: string;
    payerName?: string;
    payer_name?: string;
    notes?: string;
    receiptUrl?: string;
    receipt_url?: string;
}
export declare class SubmitSpeiPaymentDto {
    propertyId: string;
    chargeId?: string;
    amount: number;
    reference: string;
    receiptUrl: string;
    payerName?: string;
    notes?: string;
}
export declare class ReviewPaymentDto {
    status: 'APPROVED' | 'REJECTED';
    reviewedByName: string;
    notes?: string;
}
export declare class CreateAnnualCampaignDto {
    name: string;
    discountPercentage: number;
    monthsCovered: number;
    periodStart: string;
    periodEnd: string;
}
export declare class AnnualCampaignQuoteDto {
    propertyId: string;
}
export declare class SubmitAnnualPaymentDto {
    propertyId: string;
    amount: number;
    reference: string;
    receiptUrl?: string;
    payerName?: string;
}
export declare class QueryChargesDto {
    propertyId?: string;
    status?: string;
    year?: number;
    month?: number;
}
export declare class QueryPaymentsDto {
    propertyId?: string;
    paymentMethod?: string;
    status?: string;
}
