import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module'; 
import { QueueModule } from './modules/queue/queue.module';
import { WorkerModule } from './modules/workers/workers.module';
import { ExperienceModule } from './modules/experience/experience.module';

@Module({
  imports: [
    DatabaseModule, // Enables cron jobs
    SchedulerModule,
    QueueModule,
    WorkerModule,
    ExperienceModule,
  ],
})
export class AppModule {}
