import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { hashPassword } from 'src/common/utils/password.util';
import { PermissionsService } from '../permissions/permissions.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';

type SuccessResponse<T> = {
  data: T;
  message: string;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly permissionsService: PermissionsService,
    private readonly tenantsService: TenantsService,
  ) {}

  async create(tenantId: number, createUserDto: CreateUserDto): Promise<SuccessResponse<unknown>> {
    await this.tenantsService.findOne(tenantId);
    await this.permissionsService.ensureRoleIdsBelongToTenant(tenantId, createUserDto.roleIds ?? []);

    try {
      const user = await this.usersRepository.create(tenantId, {
        name: createUserDto.name,
        email: createUserDto.email,
        passwordHash: hashPassword(createUserDto.password),
        status: createUserDto.status,
      });

      await this.usersRepository.replaceUserRoles(user.id, createUserDto.roleIds ?? []);

      return {
        data: this.sanitizeUser(await this.usersRepository.findByIdIncludingInactive(tenantId, user.id)),
        message: 'User created successfully',
      };
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async findAll(tenantId: number): Promise<SuccessResponse<unknown>> {
    await this.tenantsService.findOne(tenantId);

    const users = await this.usersRepository.findAll(tenantId);

    return {
      data: users.map((user: (typeof users)[number]) => this.sanitizeUser(user)),
      message: 'Users retrieved successfully',
    };
  }

  async findOne(tenantId: number, id: number): Promise<SuccessResponse<unknown>> {
    await this.tenantsService.findOne(tenantId);

    const user = await this.usersRepository.findById(tenantId, id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} was not found`);
    }

    return {
      data: this.sanitizeUser(user),
      message: 'User retrieved successfully',
    };
  }

  async update(tenantId: number, id: number, updateUserDto: UpdateUserDto): Promise<SuccessResponse<unknown>> {
    await this.tenantsService.findOne(tenantId);
    await this.ensureUserExists(tenantId, id);
    await this.permissionsService.ensureRoleIdsBelongToTenant(tenantId, updateUserDto.roleIds ?? []);

    try {
      await this.usersRepository.update(id, {
        dto: {
          name: updateUserDto.name,
          email: updateUserDto.email,
          status: updateUserDto.status,
        },
        ...(updateUserDto.password ? { passwordHash: hashPassword(updateUserDto.password) } : {}),
      });

      if (updateUserDto.roleIds) {
        await this.usersRepository.replaceUserRoles(id, updateUserDto.roleIds);
      }

      return {
        data: this.sanitizeUser(await this.usersRepository.findByIdIncludingInactive(tenantId, id)),
        message: 'User updated successfully',
      };
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async remove(tenantId: number, id: number): Promise<SuccessResponse<unknown>> {
    await this.tenantsService.findOne(tenantId);
    await this.ensureUserExists(tenantId, id);

    await this.usersRepository.updateStatus(id, UserStatus.INACTIVE);

    return {
      data: this.sanitizeUser(await this.usersRepository.findByIdIncludingInactive(tenantId, id)),
      message: 'User deactivated successfully',
    };
  }

  private async ensureUserExists(tenantId: number, id: number): Promise<void> {
    const user = await this.usersRepository.findByIdIncludingInactive(tenantId, id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} was not found`);
    }
  }

  private handlePrismaError(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('User with the provided email already exists for this tenant');
    }
  }

  private sanitizeUser<T extends { passwordHash?: string } | null>(user: T): Omit<NonNullable<T>, 'passwordHash'> | null {
    if (!user) {
      return null;
    }

    const { passwordHash, ...safeUser } = user;

    return safeUser;
  }
}
