export declare class OrderItemDto {
    productId: string;
    quantity: number;
    size?: string;
    color?: string;
}
export declare class CreateOrderDto {
    items: OrderItemDto[];
    shippingAmount?: number;
    addressId: string;
    paymentMethod?: string;
    notes?: string;
    gateway?: string;
    country?: string;
    currency?: string;
}
export declare class UpdateOrderStatusDto {
    status: string;
    trackingId?: string;
}
