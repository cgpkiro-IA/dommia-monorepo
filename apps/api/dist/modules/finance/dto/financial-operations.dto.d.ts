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
