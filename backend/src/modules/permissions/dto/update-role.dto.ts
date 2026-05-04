import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { RoleStatusDto } from './create-role.dto';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(RoleStatusDto)
  status?: RoleStatusDto;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  permissionIds?: number[];
}
