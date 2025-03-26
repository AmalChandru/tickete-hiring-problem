import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module'; 
@Module({
  imports: [
    DatabaseModule, // Enables cron jobs
    SchedulerModule,
  ],
})
export class AppModule {}
