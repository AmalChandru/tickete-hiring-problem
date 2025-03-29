import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ExperienceService } from './experience.service';
import { GetExperienceDto } from './dto/get-experience.dto';
import logger from '../../../config/logger';

@Controller('api/v1/experience')
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  /**
   * Handles GET request to fetch available slots for a given experience (product).
   * @param id - The product ID for which slots are requested.
   * @param query - The query parameters containing the requested date.
   * @returns A list of available slots for the given experience.
   */
  @Get(':id/slots')
  async getSlots(@Param('id') id: number, @Query() query: GetExperienceDto) {
    logger.info(`Received request for productId: ${id}, date: ${query.date}`);

    // Validate the provided date parameter
    if (!query.date || isNaN(Date.parse(query.date))) {
      logger.warn(`Invalid date parameter received: ${query.date}`);
      throw new HttpException('Invalid or missing date parameter', HttpStatus.BAD_REQUEST);
    }

    // Fetch slot availability from service
    const slots = await this.experienceService.getSlotAvailability(Number(id), query.date);

    // If no slots are found, return 404
    if (!slots.length) {
      logger.warn(`No slots available for productId: ${id} on date: ${query.date}`);
      throw new HttpException('No slots available for the given product and date', HttpStatus.NOT_FOUND);
    }

    logger.info(`Successfully fetched slots for productId: ${id}, date: ${query.date}`);
    return { status: 'success', data: slots };
  }

  /**
   * Handles GET request to fetch available dates for a given experience (product).
   * Returns dates for up to the next 60 days.
   */
  @Get(':id/dates')
  async getAvailableDates(@Param('id') id: number) {
    logger.info(`Received request for available dates - productId: ${id}`);

    const dates = await this.experienceService.getAvailableDates(Number(id));

    if (!dates.length) {
      logger.warn(`No available dates found for productId: ${id}`);
      throw new HttpException('No available dates found', HttpStatus.NOT_FOUND);
    }

    logger.info(`Successfully fetched available dates for productId: ${id}`);
    return { status: 'success', data: dates };
  }
}
