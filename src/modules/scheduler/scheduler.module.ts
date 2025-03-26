import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseService } from '../../database/database.service';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [ScheduleModule.forRoot()], // Enable NestJS cron jobs
  providers: [SchedulerService, DatabaseService],
})
export class SchedulerModule {}
