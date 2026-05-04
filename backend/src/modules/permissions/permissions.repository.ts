import { Injectable } from '@nestjs/common';
import { RoleStatus } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class PermissionsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  createRole(tenantId: number, data: Omit<CreateRoleDto, 'permissionIds'>) {
    return this.prismaService.role.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        status: data.status as RoleStatus,
      },
    });
  }

  findRoles(tenantId: number) {
    return this.prismaService.role.findMany({
      where: {
        tenantId,
        status: {
          not: RoleStatus.INACTIVE,
        },
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findRoleById(tenantId: number, id: number) {
    return this.prismaService.role.findFirst({
      where: {
        id,
        tenantId,
        status: {
          not: RoleStatus.INACTIVE,
        },
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  findRoleByIdIncludingInactive(tenantId: number, id: number) {
    return this.prismaService.role.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  updateRole(id: number, data: Omit<UpdateRoleDto, 'permissionIds'>) {
    return this.prismaService.role.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        description: data.description,
        ...(data.status ? { status: data.status as RoleStatus } : {}),
      },
    });
  }

  updateRoleStatus(id: number, status: RoleStatus) {
    return this.prismaService.role.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }

  async replaceRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    await this.prismaService.$transaction(async (prisma) => {
      await prisma.rolePermission.deleteMany({
        where: {
          roleId,
        },
      });

      if (permissionIds.length === 0) {
        return;
      }

      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      });
    });
  }

  findPermissionsByIds(permissionIds: number[]) {
    return this.prismaService.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
    });
  }

  createPermission(data: CreatePermissionDto) {
    return this.prismaService.permission.create({
      data,
    });
  }

  listPermissions() {
    return this.prismaService.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  findRolesByIdsForTenant(tenantId: number, roleIds: number[]) {
    return this.prismaService.role.findMany({
      where: {
        tenantId,
        id: {
          in: roleIds,
        },
        status: {
          not: RoleStatus.INACTIVE,
        },
      },
    });
  }
}
