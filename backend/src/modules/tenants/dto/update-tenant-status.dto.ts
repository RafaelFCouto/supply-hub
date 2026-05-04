import { IsEnum } from 'class-validator';
import { TenantStatusDto } from './create-tenant.dto';

export class UpdateTenantStatusDto {
  @IsEnum(TenantStatusDto)
  status!: TenantStatusDto;
}
