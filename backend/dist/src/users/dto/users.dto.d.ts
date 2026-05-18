export declare class UpdateUserDto {
    name?: string;
    phone?: string;
    avatar?: string;
}
export declare class CreateAddressDto {
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
    isDefault?: boolean;
}
export declare class UpdateAddressDto {
    name?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    isDefault?: boolean;
}
