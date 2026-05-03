import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @Length(14, 14)
  cnpj?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
