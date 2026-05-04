import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PermissionsService } from './permissions.service';

@Controller()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post('tenants/:tenantId/roles')
  createRole(@Param('tenantId', ParseIntPipe) tenantId: number, @Body() createRoleDto: CreateRoleDto) {
    return this.permissionsService.createRole(tenantId, createRoleDto);
  }

  @Get('tenants/:tenantId/roles')
  findRoles(@Param('tenantId', ParseIntPipe) tenantId: number) {
    return this.permissionsService.findRoles(tenantId);
  }

  @Get('tenants/:tenantId/roles/:id')
  findRoleById(@Param('tenantId', ParseIntPipe) tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findRoleById(tenantId, id);
  }

  @Patch('tenants/:tenantId/roles/:id')
  updateRole(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.permissionsService.updateRole(tenantId, id, updateRoleDto);
  }

  @Delete('tenants/:tenantId/roles/:id')
  removeRole(@Param('tenantId', ParseIntPipe) tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.removeRole(tenantId, id);
  }

  @Post('permissions')
  createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.createPermission(createPermissionDto);
  }

  @Get('permissions')
  listPermissions() {
    return this.permissionsService.listPermissions();
  }
}
