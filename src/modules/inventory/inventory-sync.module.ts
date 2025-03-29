import { Module } from '@nestjs/common';
import { InventorySyncService } from './inventory-sync.service';
import { DatabaseService } from '../../database/database.service';
@Module({
  providers: [InventorySyncService, DatabaseService],
  exports: [InventorySyncService], 
})
export class InventorySyncModule {}
