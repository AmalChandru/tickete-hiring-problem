import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module'; 
import { QueueModule } from './modules/queue/queue.module';

@Module({
  imports: [
    DatabaseModule, // Enables cron jobs
    SchedulerModule,
    QueueModule,
  ],
})
export class AppModule {}
