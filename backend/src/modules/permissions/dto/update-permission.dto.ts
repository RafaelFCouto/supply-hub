import { IsIn, IsOptional, IsString } from 'class-validator';
import {
  PERMISSION_ACTIONS,
  PERMISSION_RESOURCES,
  type PermissionAction,
  type PermissionResource,
} from '../constants/permission-options';

export class UpdatePermissionDto {
  @IsOptional()
  @IsString()
  @IsIn(PERMISSION_RESOURCES)
  resource?: PermissionResource;

  @IsOptional()
  @IsString()
  @IsIn(PERMISSION_ACTIONS)
  action?: PermissionAction;
}
