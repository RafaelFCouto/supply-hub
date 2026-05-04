import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('tenants/:tenantId/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Param('tenantId', ParseIntPipe) tenantId: number, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create(tenantId, createUserDto);
  }

  @Get()
  findAll(@Param('tenantId', ParseIntPipe) tenantId: number) {
    return this.usersService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('tenantId', ParseIntPipe) tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(tenantId, id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('tenantId', ParseIntPipe) tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(tenantId, id);
  }
}
