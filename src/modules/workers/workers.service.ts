import { Injectable, Inject, OnApplicationBootstrap } from '@nestjs/common';
import { Worker, Queue } from 'bullmq';
import { DatabaseService } from '../../database/database.service';
import { FetchStatus } from '../../enums/fetch-period.enum';
import { ApiFetcherService } from '../api-fetcher/api-fetcher.service';
import logger from '../../../config/logger';

@Injectable()
export class WorkerService implements OnApplicationBootstrap {
  private worker: Worker;

  constructor(
    @Inject('FETCH_QUEUE') private readonly fetchQueue: Queue,
    private readonly prisma: DatabaseService,
    private readonly apiFetcher: ApiFetcherService, 
  ) {}

  /**
  * Initializes the worker when the application starts.
  * The worker listens for jobs in the 'fetchQueue' and processes them sequentially.
  */
  onApplicationBootstrap() {
    this.worker = new Worker( 
      'fetchQueue',
      async (job) => {
        const { jobId, productId, fetchPeriod } = job.data;

        try {
          logger.info(`Processing job ${jobId} for product ${productId}`);

          // Fetch product data from external API
          const response = await this.apiFetcher.fetchProductData(productId, fetchPeriod);
          console.log(response);

          if (response.success) {
            // Mark job as Completed only if API call succeeds
            await this.prisma.fetchJob.update({
              where: { id: Number(jobId) },
              data: { status: FetchStatus.COMPLETED }, 
            });
            logger.info(`Job ${jobId} completed successfully.`);
          } else {
            throw new Error('API Fetch Failed');
          }
        } catch (error) {
          logger.error(`Job ${jobId} failed: ${error.message}`);
          throw error; // BullMQ will handle retries
        }
      },
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
        },
        concurrency: 1, // Process one job at a time (sequential execution)
      },
    );

    /**
    * Event listener for failed jobs.
    * If a job permanently fails after retries, update its status in the database.
    */
    this.worker.on('failed', async (job, error) => {
      if (job) {
        const { jobId } = job.data;
        logger.error(`Job ${jobId} permanently failed after retries: ${error.message}`);

        // Update job status to Failed in database
        await this.prisma.fetchJob.update({
          where: { id: Number(jobId) },
          data: { status: FetchStatus.FAILED }, 
        });
      }
    });

    logger.info('Worker service initialized and listening for jobs.');
  }

  /**
  * Gracefully shuts down the worker when the module is destroyed.
  * Ensures the worker stops processing jobs before exiting.
  */
  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      logger.info('Worker service closed.');
    }
  }
}
