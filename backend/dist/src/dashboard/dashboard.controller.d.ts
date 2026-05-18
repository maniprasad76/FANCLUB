import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(): Promise<{
        totalUsers: number;
        totalProducts: number;
        totalOrders: number;
        totalRevenue: number;
        recentOrders: ({
            user: {
                email: string;
                name: string | null;
            };
            items: {
                name: string;
                id: string;
                image: string | null;
                price: number;
                size: string | null;
                color: string | null;
                productId: string;
                quantity: number;
                orderId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            orderNumber: string;
            totalAmount: number;
            shippingAmount: number;
            discountAmount: number;
            addressId: string | null;
            paymentMethod: string | null;
            paymentId: string | null;
            razorpayOrderId: string | null;
            stripeSessionId: string | null;
            status: import("@prisma/client").$Enums.OrderStatus;
            trackingId: string | null;
            notes: string | null;
        })[];
        ordersByStatus: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.OrderGroupByOutputType, "status"[]> & {
            _count: {
                status: number;
            };
        })[];
        monthlyRevenue: Record<string, number>;
    }>;
}
