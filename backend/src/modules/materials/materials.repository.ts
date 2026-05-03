import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class MaterialsRepository {
  constructor(private readonly prismaService: PrismaService) {}
}
