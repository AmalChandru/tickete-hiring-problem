import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import logger from '../../../config/logger';

@Injectable()
export class ExperienceService {
  constructor(private prisma: DatabaseService) {}

  /**
   * Fetches available slots for a given product and date.
   * @param productId - The ID of the product for which slots are requested.
   * @param date - The date for which slot availability is needed.
   * @returns A structured list of available slots along with pricing and availability details.
   */
  async getSlotAvailability(productId: number, date: string) {
    logger.info(`Fetching slot availability for productId: ${productId}, date: ${date}`);

    try {
      // Fetch available slots along with related data (paxAvailability, category, and price)
      const slots = await this.prisma.slot.findMany({
        where: { productId, startDate: date },
        include: {
          paxAvailability: {
            include: {
              paxCategory: true,
              price: true,
            },
          },
        },
      });

      // If no slots are found, log and return a 404 response
      if (!slots.length) {
        logger.warn(`No slots found for productId: ${productId} on ${date}`);
        throw new HttpException('No slots found', HttpStatus.NOT_FOUND);
      }

      logger.info(`Found ${slots.length} slots for productId: ${productId} on ${date}`);

      // Transforming slot data into required response format
      return slots.map(slot => ({
        startDate: slot.startDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        remaining: slot.remaining,
        paxAvailability: slot.paxAvailability.map(pax => ({
          max: pax.max,
          min: pax.min,
          remaining: pax.remaining,
          type: pax.paxCategory.id, // Mapping to category type
          category: pax.paxCategory.name,
          description: pax.paxCategory.description,
          price: {
            discount: pax.price.discount,
            finalPrice: pax.price.finalPrice,
            originalPrice: pax.price.originalPrice,
            currencyCode: pax.price.currencyCode,
          },
        })),
      }));
    } catch (error) {
      logger.error(`Error fetching slots for productId: ${productId}, date: ${date} - ${error.message}`);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Fetches available dates for the given product within the next 60 days.
   */
  async getAvailableDates(productId: number) {
    logger.info(`Fetching available dates for productId: ${productId}`);

    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 60); // 60 days from today

      const todayStr = today.toISOString().split('T')[0]; 
      const futureDateStr = futureDate.toISOString().split('T')[0]; 

      // Fetch distinct available dates from slots table
      const dates = await this.prisma.slot.findMany({
        where: {
          productId,
          startDate: { gte: todayStr, lte: futureDateStr },
        },
        select: {
          startDate: true,
          paxAvailability: {
            select: {
              price: {
                select: {
                  discount: true,
                  finalPrice: true,
                  originalPrice: true,
                  currencyCode: true,
                },
              },
            },
          },
        },
        orderBy: {
          startDate: 'asc',
        },
      });

      if (!dates.length) {
        logger.warn(`No available dates found for productId: ${productId}`);
        throw new HttpException('No available dates found', HttpStatus.NOT_FOUND);
      }

      // Transforming the data into required format
      return dates.map(slot => ({
        date: slot.startDate,
        price: slot.paxAvailability.length > 0 ? {
          currencyCode: slot.paxAvailability[0].price.currencyCode,
          discount: slot.paxAvailability[0].price.discount,
          finalPrice: slot.paxAvailability[0].price.finalPrice,
          originalPrice: slot.paxAvailability[0].price.originalPrice,
        } : null, // In case there is no price information
      }));
    } catch (error) {
      logger.error(`Error fetching available dates for productId: ${productId} - ${error.message}`);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
