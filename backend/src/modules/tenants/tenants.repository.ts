import { Injectable } from '@nestjs/common';
import { TenantStatus } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(data: CreateTenantDto) {
    return this.prismaService.tenant.create({
      data,
    });
  }

  findAll() {
    return this.prismaService.tenant.findMany({
      where: {
        status: {
          not: TenantStatus.INACTIVE,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findById(id: number) {
    return this.prismaService.tenant.findFirst({
      where: {
        id,
        status: {
          not: TenantStatus.INACTIVE,
        },
      },
    });
  }

  findByIdIncludingInactive(id: number) {
    return this.prismaService.tenant.findUnique({
      where: {
        id,
      },
    });
  }

  findByCnpj(cnpj: string) {
    return this.prismaService.tenant.findUnique({
      where: {
        cnpj,
      },
    });
  }

  update(id: number, data: UpdateTenantDto) {
    return this.prismaService.tenant.update({
      where: {
        id,
      },
      data,
    });
  }

  updateStatus(id: number, status: TenantStatus) {
    return this.prismaService.tenant.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }
}
