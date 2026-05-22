import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  UpdateUserDto,
  CreateAddressDto,
  UpdateAddressDto,
} from './dto/users.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.usersService.findAll(+page, +limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  getMyProfile(@CurrentUser('authId') authId: string) {
    return this.usersService.findByAuthId(authId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/profile')
  updateProfile(
    @CurrentUser('authId') authId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(authId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/addresses')
  addAddress(
    @CurrentUser('authId') authId: string,
    @Body() dto: CreateAddressDto,
  ) {
    return this.usersService.addAddress(authId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/addresses/:addressId')
  updateAddress(
    @CurrentUser('authId') authId: string,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(authId, addressId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/addresses/:addressId')
  deleteAddress(@Param('addressId') addressId: string) {
    return this.usersService.deleteAddress(addressId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
