import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import logger from '../../../config/logger'; 

@Injectable()
export class InventorySyncService {
  constructor(private prisma: DatabaseService) {}

  /**
   * Saves inventory data for a given product.
   * 
   * @param productId - The unique identifier of the product.
   * @param inventoryData - The inventory data fetched from the API.
   */
  async saveInventoryData(productId: number, inventoryData: any) {
    logger.info(`[InventorySyncService] Saving inventory for product ${productId}`);
    
    // Iterate over each slot in the inventory data
    for (const slot of inventoryData) {
      const { 
        providerSlotId, startDate, startTime, endTime, 
        remaining, variantId, currencyCode, paxAvailability 
      } = slot;

      logger.info(`Processing slot: providerSlotId=${providerSlotId}, startDate=${startDate}`);

      try {
        // Insert a new slot record in the database
        const slotRecord = await this.prisma.slot.create({
          data: {
            providerSlotId,
            productId,
            startDate,
            startTime,
            endTime,
            remaining,
            variantId,
            currencyCode,
          },
        });
        logger.info(`Created slot with ID: ${slotRecord.id}`);

        // Process each pax availability entry for the slot
        for (const pax of paxAvailability) {
          const { 
            type, name, description, max, min, 
            remaining: paxRemaining, isPrimary, price 
          } = pax;

          logger.info(`🔹 Processing pax type: ${type}, name=${name}`);

          // Insert price details for the pax category
          const priceRecord = await this.prisma.price.create({
            data: {
              finalPrice: price.finalPrice,
              originalPrice: price.originalPrice,
              discount: price.discount,
              currencyCode: price.currencyCode,
            },
          });
          logger.info(`Inserted price ID: ${priceRecord.id}`);

          // Upsert (update or insert) the pax category details
          const paxCategoryRecord = await this.prisma.paxCategory.upsert({
            where: { id: type },
            update: { name, description },
            create: { id: type, name, description },
          });
          logger.info(`Upserted pax category ID: ${paxCategoryRecord.id}`);

          // Link pax availability to the slot
          await this.prisma.paxAvailability.create({
            data: {
              slotId: slotRecord.id,
              paxCategoryId: paxCategoryRecord.id,
              priceId: priceRecord.id,
              max,
              min,
              remaining: paxRemaining,
              isPrimary: isPrimary || false,
            },
          });
          logger.info(`Linked PaxAvailability for slot ID: ${slotRecord.id}`);
        }
      } catch (error) {
        // Log any errors encountered during the database insertion process
        logger.error(`Error saving inventory data for product ${productId}: ${error.message}`);
      }
    }
    
    logger.info(`[InventorySyncService] Successfully saved inventory for product ${productId}`);
  }
}
