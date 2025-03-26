import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../../database/database.service';
import logger from '../../../config/logger';
import { FetchPeriod, FetchStatus } from '../../enums/fetch-period.enum'; 

@Injectable()
export class SchedulerService {
  constructor(private readonly prisma: DatabaseService) {}

  @Cron('0 */15 * * * *')
  async scheduleEvery15Minutes() {
    logger.info('Running 15-minute cron job...');
    await this.createFetchJobs(FetchPeriod.FIFTEEN_MINUTES);
  }

  @Cron(CronExpression.EVERY_4_HOURS)
  async scheduleEvery4Hours() {
    logger.info('Running 4-hour cron job...');
    await this.createFetchJobs(FetchPeriod.FOUR_HOURS);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async scheduleDaily() {
    logger.info('Running daily cron job...');
    await this.createFetchJobs(FetchPeriod.DAILY);
  }

  private async createFetchJobs(fetchPeriod: FetchPeriod) {
    try {
      const activeProducts = await this.prisma.fetchStatus.findMany({
        where: { isFetchingEnabled: true },
        select: { productId: true },
      });

      if (activeProducts.length === 0) {
        logger.warn(`No active products found for fetch period ${FetchPeriod[fetchPeriod]}`);
        return;
      }

      const jobs = activeProducts.map((product) => ({
        productId: product.productId,
        fetchPeriod,
        status: FetchStatus.PENDING, 
        createdAt: new Date(),
      }));

      await this.prisma.fetchJob.createMany({ data: jobs });

      logger.info(`Created ${jobs.length} jobs for fetch period ${FetchPeriod[fetchPeriod]}`);
    } catch (error) {
      logger.error(`Error creating fetch jobs: ${error.message}`, { error });
    }
  }
}
