import { UsersService } from './users.service';
import { UpdateUserDto, CreateAddressDto, UpdateAddressDto } from './dto/users.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
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
    getMyProfile(authId: string): Promise<{
        addresses: {
            name: string;
            phone: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            street: string;
            city: string;
            state: string;
            pincode: string;
            country: string;
            isDefault: boolean;
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
    updateProfile(authId: string, dto: UpdateUserDto): Promise<{
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
        userId: string;
        street: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
        isDefault: boolean;
    }>;
    updateAddress(authId: string, addressId: string, dto: UpdateAddressDto): Promise<{
        name: string;
        phone: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        street: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
        isDefault: boolean;
    }>;
    deleteAddress(addressId: string): Promise<{
        name: string;
        phone: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        street: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
        isDefault: boolean;
    }>;
    findById(id: string): Promise<{
        addresses: {
            name: string;
            phone: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            street: string;
            city: string;
            state: string;
            pincode: string;
            country: string;
            isDefault: boolean;
        }[];
        orders: {
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
}
