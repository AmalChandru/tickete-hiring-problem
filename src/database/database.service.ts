import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import logger from '../../config/logger'; 

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    logger.info('Database connected successfully'); 
  }

  async onModuleDestroy() {
    await this.$disconnect();
    logger.info('Database connection closed'); 
  }
}
