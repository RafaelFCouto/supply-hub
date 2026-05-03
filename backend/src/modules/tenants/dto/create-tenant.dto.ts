import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';

export enum TenantStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @Length(14, 14)
  cnpj!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsEnum(TenantStatusDto)
  status: TenantStatusDto = TenantStatusDto.ACTIVE;
}
