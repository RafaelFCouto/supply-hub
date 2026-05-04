import { Injectable } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(
    tenantId: number,
    data: {
      name: string;
      email: string;
      passwordHash: string;
      status: string;
    },
  ) {
    return this.prismaService.user.create({
      data: {
        tenantId,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        status: data.status as UserStatus,
      },
    });
  }

  findAll(tenantId: number) {
    return this.prismaService.user.findMany({
      where: {
        tenantId,
        status: {
          not: UserStatus.INACTIVE,
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findById(tenantId: number, id: number) {
    return this.prismaService.user.findFirst({
      where: {
        tenantId,
        id,
        status: {
          not: UserStatus.INACTIVE,
        },
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  findByIdIncludingInactive(tenantId: number, id: number) {
    return this.prismaService.user.findFirst({
      where: {
        tenantId,
        id,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  findByEmail(email: string) {
    return this.prismaService.user.findFirst({
      where: {
        email,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  update(
    id: number,
    data: {
      dto: Omit<UpdateUserDto, 'password' | 'roleIds'>;
      passwordHash?: string;
    },
  ) {
    return this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        ...data.dto,
        ...(data.dto.status ? { status: data.dto.status as UserStatus } : {}),
        ...(data.passwordHash ? { passwordHash: data.passwordHash } : {}),
      },
    });
  }

  updateStatus(id: number, status: UserStatus) {
    return this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }

  async replaceUserRoles(userId: number, roleIds: number[]): Promise<void> {
    await this.prismaService.$transaction(async (prisma) => {
      await prisma.userRole.deleteMany({
        where: {
          userId,
        },
      });

      if (roleIds.length === 0) {
        return;
      }

      await prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId,
          roleId,
        })),
      });
    });
  }
}
