import { Module } from '@nestjs/common';
import { WorkerService } from './workers.service';
import { QueueModule } from '../queue/queue.module';
import { DatabaseModule } from 'src/database/database.module';
import { ApiFetcherModule } from '../api-fetcher/api-fetcher.module';

@Module({
  imports: [
    QueueModule,  
    DatabaseModule, 
    ApiFetcherModule, 
  ],
  providers: [WorkerService],
  exports: [WorkerService],
})
export class WorkerModule {}
