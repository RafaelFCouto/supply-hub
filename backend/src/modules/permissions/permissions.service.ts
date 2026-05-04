import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RoleStatus } from '@prisma/client';
import { TenantsService } from '../tenants/tenants.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PermissionsRepository } from './permissions.repository';

type SuccessResponse<T> = {
  data: T;
  message: string;
};

@Injectable()
export class PermissionsService {
  constructor(
    private readonly permissionsRepository: PermissionsRepository,
    private readonly tenantsService: TenantsService,
  ) {}

  async createRole(tenantId: number, createRoleDto: CreateRoleDto): Promise<SuccessResponse<unknown>> {
    await this.tenantsService.findOne(tenantId);
    await this.ensurePermissionIdsExist(createRoleDto.permissionIds);

    try {
      const role = await this.permissionsRepository.createRole(tenantId, {
        name: createRoleDto.name,
        description: createRoleDto.description,
        status: createRoleDto.status,
      });

      await this.permissionsRepository.replaceRolePermissions(role.id, createRoleDto.permissionIds ?? []);

      return {
        data: await this.permissionsRepository.findRoleByIdIncludingInactive(tenantId, role.id),
        message: 'Role created successfully',
      };
    } catch (error) {
      this.handlePrismaError(error, 'role');
      throw error;
    }
  }

  async findRoles(tenantId: number): Promise<SuccessResponse<unknown>> {
    await this.tenantsService.findOne(tenantId);

    return {
      data: await this.permissionsRepository.findRoles(tenantId),
      message: 'Roles retrieved successfully',
    };
  }

  async findRoleById(tenantId: number, id: number): Promise<SuccessResponse<unknown>> {
    await this.tenantsService.findOne(tenantId);

    const role = await this.permissionsRepository.findRoleById(tenantId, id);

    if (!role) {
      throw new NotFoundException(`Role with id ${id} was not found`);
    }

    return {
      data: role,
      message: 'Role retrieved successfully',
    };
  }

  async updateRole(tenantId: number, id: number, updateRoleDto: UpdateRoleDto): Promise<SuccessResponse<unknown>> {
    await this.tenantsService.findOne(tenantId);
    await this.ensureRoleExists(tenantId, id);
    await this.ensurePermissionIdsExist(updateRoleDto.permissionIds);

    try {
      await this.permissionsRepository.updateRole(id, {
        name: updateRoleDto.name,
        description: updateRoleDto.description,
        status: updateRoleDto.status,
      });

      if (updateRoleDto.permissionIds) {
        await this.permissionsRepository.replaceRolePermissions(id, updateRoleDto.permissionIds);
      }

      return {
        data: await this.permissionsRepository.findRoleByIdIncludingInactive(tenantId, id),
        message: 'Role updated successfully',
      };
    } catch (error) {
      this.handlePrismaError(error, 'role');
      throw error;
    }
  }

  async removeRole(tenantId: number, id: number): Promise<SuccessResponse<unknown>> {
    await this.tenantsService.findOne(tenantId);
    await this.ensureRoleExists(tenantId, id);

    await this.permissionsRepository.updateRoleStatus(id, RoleStatus.INACTIVE);

    return {
      data: await this.permissionsRepository.findRoleByIdIncludingInactive(tenantId, id),
      message: 'Role deactivated successfully',
    };
  }

  async createPermission(createPermissionDto: CreatePermissionDto): Promise<SuccessResponse<unknown>> {
    try {
      return {
        data: await this.permissionsRepository.createPermission(createPermissionDto),
        message: 'Permission created successfully',
      };
    } catch (error) {
      this.handlePrismaError(error, 'permission');
      throw error;
    }
  }

  async listPermissions(): Promise<SuccessResponse<unknown>> {
    return {
      data: await this.permissionsRepository.listPermissions(),
      message: 'Permissions retrieved successfully',
    };
  }

  async updatePermission(id: number, updatePermissionDto: UpdatePermissionDto): Promise<SuccessResponse<unknown>> {
    await this.ensurePermissionExists(id);

    try {
      await this.permissionsRepository.updatePermission(id, updatePermissionDto);

      return {
        data: await this.permissionsRepository.findPermissionById(id),
        message: 'Permission updated successfully',
      };
    } catch (error) {
      this.handlePrismaError(error, 'permission');
      throw error;
    }
  }

  async ensureRoleIdsBelongToTenant(tenantId: number, roleIds: number[]): Promise<void> {
    if (roleIds.length === 0) {
      return;
    }

    const roles = await this.permissionsRepository.findRolesByIdsForTenant(tenantId, roleIds);

    if (roles.length !== new Set(roleIds).size) {
      throw new BadRequestException('One or more roles do not belong to the provided tenant');
    }
  }

  private async ensurePermissionIdsExist(permissionIds?: number[]): Promise<void> {
    if (!permissionIds || permissionIds.length === 0) {
      return;
    }

    const permissions = await this.permissionsRepository.findPermissionsByIds(permissionIds);

    if (permissions.length !== new Set(permissionIds).size) {
      throw new BadRequestException('One or more permissions do not exist');
    }
  }

  private async ensureRoleExists(tenantId: number, id: number): Promise<void> {
    const role = await this.permissionsRepository.findRoleByIdIncludingInactive(tenantId, id);

    if (!role) {
      throw new NotFoundException(`Role with id ${id} was not found`);
    }
  }

  private async ensurePermissionExists(id: number): Promise<void> {
    const permission = await this.permissionsRepository.findPermissionById(id);

    if (!permission) {
      throw new NotFoundException(`Permission with id ${id} was not found`);
    }
  }

  private handlePrismaError(error: unknown, entity: 'role' | 'permission'): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      if (entity === 'role') {
        throw new ConflictException('Role with the provided name already exists for this tenant');
      }

      throw new ConflictException('Permission with the provided resource and action already exists');
    }
  }
}
