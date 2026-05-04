import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TenantStatus } from '@prisma/client';
import { CreateTenantDto, TenantStatusDto } from './dto/create-tenant.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsRepository } from './tenants.repository';

type SuccessResponse<T> = {
  data: T;
  message: string;
};

@Injectable()
export class TenantsService {
  constructor(private readonly tenantsRepository: TenantsRepository) {}

  async create(createTenantDto: CreateTenantDto): Promise<SuccessResponse<Awaited<ReturnType<TenantsRepository['create']>>>> {
    try {
      const tenant = await this.tenantsRepository.create(createTenantDto);

      return {
        data: tenant,
        message: 'Tenant created successfully',
      };
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async findAll(): Promise<SuccessResponse<Awaited<ReturnType<TenantsRepository['findAll']>>>> {
    const tenants = await this.tenantsRepository.findAll();

    return {
      data: tenants,
      message: 'Tenants retrieved successfully',
    };
  }

  async findOne(id: number): Promise<SuccessResponse<Awaited<ReturnType<TenantsRepository['findById']>>>> {
    const tenant = await this.tenantsRepository.findById(id);

    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} was not found`);
    }

    return {
      data: tenant,
      message: 'Tenant retrieved successfully',
    };
  }

  async update(
    id: number,
    updateTenantDto: UpdateTenantDto,
  ): Promise<SuccessResponse<Awaited<ReturnType<TenantsRepository['update']>>>> {
    await this.ensureTenantExists(id);
    await this.ensureCnpjIsAvailable(id, updateTenantDto.cnpj);

    try {
      const tenant = await this.tenantsRepository.update(id, updateTenantDto);

      return {
        data: tenant,
        message: 'Tenant updated successfully',
      };
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async remove(id: number): Promise<SuccessResponse<Awaited<ReturnType<TenantsRepository['update']>>>> {
    const tenant = await this.tenantsRepository.updateStatus(id, TenantStatus.INACTIVE);

    return {
      data: tenant,
      message: 'Tenant deactivated successfully',
    };
  }

  async updateStatus(
    id: number,
    updateTenantStatusDto: UpdateTenantStatusDto,
  ): Promise<SuccessResponse<Awaited<ReturnType<TenantsRepository['updateStatus']>>>> {
    await this.ensureTenantExistsIncludingInactive(id);

    const tenant = await this.tenantsRepository.updateStatus(id, updateTenantStatusDto.status as TenantStatus);

    return {
      data: tenant,
      message: 'Tenant status updated successfully',
    };
  }

  private async ensureTenantExists(id: number): Promise<void> {
    const tenant = await this.tenantsRepository.findById(id);

    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} was not found`);
    }
  }

  private async ensureTenantExistsIncludingInactive(id: number): Promise<void> {
    const tenant = await this.tenantsRepository.findByIdIncludingInactive(id);

    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} was not found`);
    }
  }

  private async ensureCnpjIsAvailable(id: number, cnpj?: string): Promise<void> {
    if (!cnpj) {
      return;
    }

    const tenant = await this.tenantsRepository.findByCnpj(cnpj);

    if (tenant && tenant.id !== id) {
      throw new ConflictException(`Tenant with cnpj ${cnpj} already exists`);
    }
  }

  private handlePrismaError(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Tenant with the provided cnpj already exists');
    }
  }
}
