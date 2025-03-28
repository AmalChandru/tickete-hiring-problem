import { Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QueueService } from './queue.service';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [
    ScheduleModule,
    DatabaseModule,  
  ],
  providers: [
    {
      provide: 'FETCH_QUEUE',
      useFactory: () => {
        return new Queue('fetchQueue', {
          connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
          },
        });
      },
    },
    QueueService,
  ],
  exports: ['FETCH_QUEUE', QueueService],
})
export class QueueModule {}
