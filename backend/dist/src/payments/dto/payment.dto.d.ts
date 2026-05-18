export declare class CreatePaymentDto {
    orderId: string;
    gateway?: string;
    country?: string;
    currency?: string;
}
export declare class VerifyRazorpayDto {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    signature: string;
}
export declare class RefundDto {
    amount?: number;
    reason?: string;
}
export declare class RetryPaymentDto {
    gateway?: string;
}
