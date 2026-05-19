import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, CreateAddressDto, UpdateAddressDto } from './dto/users.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(page?: number, limit?: number): Promise<{
        users: {
            email: string;
            name: string | null;
            phone: string | null;
            id: string;
            authId: string;
            avatar: string | null;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        pages: number;
    }>;
    findByAuthId(authId: string): Promise<{
        addresses: {
            name: string;
            phone: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            street: string;
            city: string;
            state: string;
            pincode: string;
            country: string;
            isDefault: boolean;
            userId: string;
        }[];
    } & {
        email: string;
        name: string | null;
        phone: string | null;
        id: string;
        authId: string;
        avatar: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findById(id: string): Promise<{
        addresses: {
            name: string;
            phone: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            street: string;
            city: string;
            state: string;
            pincode: string;
            country: string;
            isDefault: boolean;
            userId: string;
        }[];
        orders: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            addressId: string | null;
            status: import("@prisma/client").$Enums.OrderStatus;
            notes: string | null;
            razorpayOrderId: string | null;
            orderNumber: string;
            totalAmount: number;
            shippingAmount: number;
            discountAmount: number;
            paymentMethod: string | null;
            paymentId: string | null;
            stripeSessionId: string | null;
            trackingId: string | null;
        }[];
    } & {
        email: string;
        name: string | null;
        phone: string | null;
        id: string;
        authId: string;
        avatar: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(authId: string, dto: UpdateUserDto): Promise<{
        email: string;
        name: string | null;
        phone: string | null;
        id: string;
        authId: string;
        avatar: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    }>;
    addAddress(authId: string, dto: CreateAddressDto): Promise<{
        name: string;
        phone: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        street: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
        isDefault: boolean;
        userId: string;
    }>;
    updateAddress(authId: string, addressId: string, dto: UpdateAddressDto): Promise<{
        name: string;
        phone: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        street: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
        isDefault: boolean;
        userId: string;
    }>;
    deleteAddress(addressId: string): Promise<{
        name: string;
        phone: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        street: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
        isDefault: boolean;
        userId: string;
    }>;
}
