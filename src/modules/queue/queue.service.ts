import { Injectable, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { DatabaseService } from '../../database/database.service';
import { FetchPeriod } from '../../enums/fetch-period.enum';
import logger from '../../../config/logger'; 

@Injectable()
export class QueueService {
  constructor(
    @Inject('FETCH_QUEUE') private readonly fetchQueue: Queue, 
    private readonly prisma: DatabaseService,
  ) {}

  /**
  * Runs every 20 minutes to enqueue pending jobs from the database.
  * - The fetch jobs are created every 15 minutes, so a 20-minute interval ensures all records are available before processing.
  * - Prevents race conditions where the scheduler runs before all jobs are inserted into the database.
  * - Provides a buffer period to handle slight delays in job creation and database consistency.
  */
  @Cron('*/20 * * * *') // Runs every 20 minutes
  async enqueueFetchJobs() {
    logger.info('Running scheduled job: Fetching pending jobs from database...');

    const jobs = await this.prisma.fetchJob.findMany({
      where: { status: 0 }, 
      orderBy: { fetchPeriod: 'asc' }, // Prioritize 15-min > 4-hour > daily
    });

    if (jobs.length === 0) {
      logger.warn('No pending jobs found for scheduling.');
      return;
    }

    logger.info(`Found ${jobs.length} pending jobs. Adding to queue...`);

    for (const job of jobs) {
      const priority = this.getJobPriority(job.fetchPeriod);

      await this.fetchQueue.add(
        'fetch-product-data',
        { productId: job.productId, fetchPeriod: job.fetchPeriod },
        { priority },
      );

      // Mark job as in-progress
      await this.prisma.fetchJob.update({
        where: { id: job.id },
        data: { status: 1 }, // 1 = In Progress
      });

      logger.info(
        `Job ${job.id} (Product: ${job.productId}) added to queue with priority ${priority}.`,
      );
    }
  }

  /**
  * Determines priority based on fetchPeriod.
  * Lower number = higher priority in BullMQ.
  */
  private getJobPriority(fetchPeriod: FetchPeriod): number {
    switch (fetchPeriod) {
      case FetchPeriod.FIFTEEN_MINUTES:
        return 1;
      case FetchPeriod.FOUR_HOURS:
        return 2;
      case FetchPeriod.DAILY:
        return 3;
      default:
        return 3;
    }
  }
}
