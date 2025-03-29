import { Module } from '@nestjs/common';
import { ApiFetcherService } from './api-fetcher.service';
import { InventorySyncModule } from '../inventory/inventory-sync.module';
@Module({
  imports: [InventorySyncModule],
  providers: [ApiFetcherService],
  exports: [ApiFetcherService], 
})
export class ApiFetcherModule {}
