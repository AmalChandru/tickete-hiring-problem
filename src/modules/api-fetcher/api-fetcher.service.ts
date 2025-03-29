import { Injectable } from '@nestjs/common';
import axios from 'axios';
import logger from '../../../config/logger';
import { InventorySyncService } from '../inventory/inventory-sync.service';

@Injectable()
export class ApiFetcherService {
  // Keeps track of the number of API requests made in the current minute
  private requestsInMinute = 0;

  // Queue to store pending API requests when the rate limit is reached
  private requestQueue: {
    productId: number;
    fetchPeriod: number;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }[] = [];

  constructor(private inventorySyncService: InventorySyncService) {
    // Reset the request count every minute and process any queued requests
    setInterval(() => {
      this.requestsInMinute = 0;
      this.processQueue();
    }, 60 * 1000);
  }

  /**
   * Adds a product fetch request to the queue and processes it.
   * @param productId - The ID of the product to fetch data for.
   * @param fetchPeriod - The interval at which the data should be fetched.
   * @returns A promise that resolves with the API response data.
   */
  async fetchProductData(
    productId: number,
    fetchPeriod: number
  ): Promise<{ success: boolean; data?: any }> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ productId, fetchPeriod, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Processes the request queue, ensuring that no more than 30 requests are made per minute.
   * Requests are dequeued and executed based on available request slots.
   */
  private async processQueue() {
    while (this.requestsInMinute < 30 && this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (!request) return;

      const { productId, fetchPeriod, resolve, reject } = request;
      this.requestsInMinute++;

      try {
        if (fetchPeriod === 0) {
          // Fetch data for the next 30 days (Daily fetch)
          const responses = await this.fetchForMultipleDays(productId, 30);
          resolve({ success: true, data: responses });
        } else if (fetchPeriod === 1) {
          // Fetch data for the next 7 days (4-hour fetch)
          const responses = await this.fetchForMultipleDays(productId, 7);
          resolve({ success: true, data: responses });
        } else if (fetchPeriod === 2) {
          // Fetch data for today only (15-minute fetch)
          const today = this.getDateDaysFromNow(0);
          const response = await this.makeApiCall(productId, today);
          resolve({ success: true, data: response.data });
        }
      } catch (error) {
        logger.error(`API call failed for product ${productId}: ${error.message}`);
        reject({ success: false });
      }
    }
  }

  /**
   * Fetches product data for multiple days in a loop.
   * @param productId - The ID of the product.
   * @param days - The number of days to fetch data for.
   * @returns An array of API responses.
   */
  private async fetchForMultipleDays(productId: number, days: number) {
    const responses: { success: boolean; data?: any }[] = [];
    for (let i = 0; i < days; i++) {
      const date = this.getDateDaysFromNow(i);
      const response = await this.makeApiCall(productId, date);
      responses.push({ success: true, data: response.data });
    }
    return responses;
  }

  /**
   * Makes an API call to fetch product data for a specific date.
   * @param productId - The ID of the product.
   * @param date - The date for which data is requested.
   * @returns The API response.
   */
  private async makeApiCall(productId: number, date: string) {
    const apiUrl = `https://leap-api.tickete.co/api/v1/inventory/${productId}?date=${date}`;
  
    try {
      logger.info(`Sending request to: ${apiUrl}`);
  
      const response = await axios.get(apiUrl, {
        headers: { 'x-api-key': process.env.API_KEY },
        timeout: 10000,
      });
  
      logger.info(`Received response for ${productId}: ${response.status}`);
      console.log(response);
      await this.inventorySyncService.saveInventoryData(productId, response.data);
      return response;
    } catch (error) {
      logger.error(`API call failed for ${productId}: ${error.message}`);
      throw new Error(`Failed to fetch product ${productId}: ${error.message}`);
    }
  }

  /**
   * Returns a formatted date string for a given number of days from today.
   * @param days - The number of days from today.
   * @returns A string representing the date in YYYY-MM-DD format.
   */
  private getDateDaysFromNow(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0]; // Returns date in YYYY-MM-DD format
  }
}
