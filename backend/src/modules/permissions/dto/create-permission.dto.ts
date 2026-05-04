import { IsIn, IsString } from 'class-validator';
import { PERMISSION_ACTIONS, PERMISSION_RESOURCES, type PermissionAction, type PermissionResource } from '../constants/permission-options';

export class CreatePermissionDto {
  @IsString()
  @IsIn(PERMISSION_RESOURCES)
  resource!: PermissionResource;

  @IsString()
  @IsIn(PERMISSION_ACTIONS)
  action!: PermissionAction;
}
