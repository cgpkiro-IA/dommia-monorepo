export declare enum FeeType {
    FIXED_RECURRENT = "FIXED_RECURRENT",
    VARIABLE_LOT_SIZE = "VARIABLE_LOT_SIZE",
    EXTRAORDINARY = "EXTRAORDINARY"
}
export declare enum FeeFrequency {
    MONTHLY = "MONTHLY",
    BI_MONTHLY = "BI_MONTHLY",
    ANNUAL = "ANNUAL",
    ONE_TIME = "ONE_TIME"
}
export declare enum LateFeeType {
    NONE = "NONE",
    PERCENTAGE = "PERCENTAGE",
    FIXED = "FIXED"
}
export declare enum EarlyBirdDiscountType {
    NONE = "NONE",
    PERCENTAGE = "PERCENTAGE",
    FIXED = "FIXED"
}
export declare class CreateFeeConfigurationDto {
    name: string;
    feeType: FeeType;
    baseAmount: number;
    frequency?: FeeFrequency;
    dueDay?: number;
    graceDays?: number;
    lateFeeType?: LateFeeType;
    lateFeeAmount?: number;
    earlyBirdDiscountType?: EarlyBirdDiscountType;
    earlyBirdDiscountAmount?: number;
    earlyBirdDeadlineDay?: number;
    appliesToAllProperties?: boolean;
    isActive?: boolean;
    description?: string;
}
export declare class UpdateFeeConfigurationDto {
    name?: string;
    feeType?: FeeType;
    baseAmount?: number;
    frequency?: FeeFrequency;
    dueDay?: number;
    graceDays?: number;
    lateFeeType?: LateFeeType;
    lateFeeAmount?: number;
    earlyBirdDiscountType?: EarlyBirdDiscountType;
    earlyBirdDiscountAmount?: number;
    earlyBirdDeadlineDay?: number;
    appliesToAllProperties?: boolean;
    isActive?: boolean;
    description?: string;
}
