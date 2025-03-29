# Fetching Service - System Design & Architecture

## 1. Overview
A scalable inventory fetching service that periodically syncs product availability data from a partner API. It supports configurable fetching intervals, rate limiting, batch processing, and API endpoints for retrieving availability data. Includes pause/resume functionality per product. It follows a structured approach with queue-based scheduling and worker processing, ensuring timely and prioritized data synchronization.

---

## 2. System Components

### 2.1 Queue Scheduler
The Queue Scheduler enqueues fetch jobs into a **BullMQ queue** at predefined intervals based on job frequency.

#### How It Works
1. **Scheduled Execution:** Runs every **20 minutes** to pick up fetch jobs (created every 15 minutes) and enqueue them.
2. **Fetching Pending Jobs:** Queries the `FetchJob` table for jobs with `status = 0` (Pending), ordered by `fetchPeriod` for prioritization.
3. **Adding Jobs to Queue:** Jobs are added to **BullMQ** with priority based on `fetchPeriod`:
   - **1 (Highest Priority)** → 15-minute jobs
   - **2** → 4-hour jobs
   - **3 (Lowest Priority)** → Daily jobs
4. **Updating Job Status:** Once enqueued, jobs are marked **In Progress (`status = 1`)** to prevent duplicate processing.

#### Queue Structure in Redis
- `bull:fetchQueue:prioritized` → Holds job IDs sorted by priority.
- `bull:fetchQueue:<jobId>` → Stores job details (priority, data, timestamp).

#### Key Design Decisions
- **Ensures Timely Execution:** Prioritizes frequent jobs first.
- **Prevents Race Conditions:** 20-minute scheduler ensures all 15-minute jobs exist before processing.
- **Efficient Queuing:** Uses **BullMQ** for rate-limited job execution.

---

### 2.2 Worker Service
The Worker Service **listens to `fetchQueue`** and processes fetch jobs **sequentially**.

#### How It Works
1. **Listening for Jobs:** The worker starts listening for jobs in the queue on service startup.
2. **Processing Fetch Jobs:**
   - Retrieves job details (e.g., `productId`, `fetchPeriod`).
   - Calls **API Fetcher Service** to fetch product data.
   - Updates `FetchJob` status (`2 = Completed`, `3 = Failed`).
3. **Handling Failures:** Failed jobs are retried automatically; permanent failures are logged and marked **FAILED**.
4. **Graceful Shutdown:** The worker stops processing jobs before shutdown to prevent data loss.

#### Key Design Decisions
- **Sequential Processing:** Ensures controlled API request execution.
- **Automatic Retries:** Uses BullMQ’s retry mechanism to handle transient API failures.
- **Error Handling:** Logs failed jobs for debugging and monitoring.

---

### 2.3 API Fetcher Service
The **API Fetcher Service** ensures product inventory data is retrieved efficiently without exceeding API rate limits.

#### How It Works
1. **Rate Limiting & Queuing:** Ensures API requests do not exceed **30 requests per minute**; excess requests are queued.
2. **Fetching Data:**
   - **15-minute Jobs (`fetchPeriod = 2`)** → Fetches **same-day** data.
   - **4-hour Jobs (`fetchPeriod = 1`)** → Fetches **7-day** data.
   - **Daily Jobs (`fetchPeriod = 0`)** → Fetches **30-day** data.
3. **Job Execution Flow:**
   - Picks jobs from `FetchJob` where `status = 0` (Pending).
   - Calls the API and updates job status (`1 = In Progress`, `2 = Completed`, `3 = Failed`).
   - Stores inventory data in the **database**.

#### Key Design Decisions
- **Rate Limit Compliance:** Uses **queue-based processing** to stay within API limits.
- **Configurable Fetching:** Allows enabling/disabling fetching per product.
- **Optimized Querying:** Uses integer-based `fetchPeriod` values for efficient filtering.

---

### 2.4 Inventory Sync Logic
Processes **slot-based inventory data** received from the external API and stores it in a **normalized database schema**.

#### Why This Approach?
- **Normalized Data Structure:** Avoids redundancy, improves query performance.
- **Efficient Lookups:** Splitting slots, pax categories, and pricing reduces excessive joins.
- **Scalability:** Structured schema ensures high-volume data handling without degradation.

#### Database Schema

##### `slots` Table - Stores slot availability.
```sql
CREATE TABLE slots (
    id SERIAL PRIMARY KEY,
    provider_slot_id VARCHAR(255) UNIQUE NOT NULL,
    product_id INT NOT NULL,
    start_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    remaining INT NOT NULL,
    variant_id VARCHAR(255),
    currency_code VARCHAR(10)
);
```

##### `pax_categories` Table - Stores passenger categories (e.g., Adult, Child).
```sql
CREATE TABLE pax_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);
```

##### `prices` Table - Stores pricing information.
```sql
CREATE TABLE prices (
    id SERIAL PRIMARY KEY,
    final_price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    discount DECIMAL(10,2),
    currency_code VARCHAR(10) NOT NULL
);
```

##### `pax_availability` Table - Links slots, pax categories, and prices.
```sql
CREATE TABLE pax_availability (
    id SERIAL PRIMARY KEY,
    slot_id INT REFERENCES slots(id) ON DELETE CASCADE,
    pax_category_id VARCHAR(50) REFERENCES pax_categories(id),
    price_id INT REFERENCES prices(id) ON DELETE SET NULL,
    max INT NOT NULL,
    min INT NOT NULL,
    remaining INT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE
);
```

#### Key Design Decisions
- **Separation of Concerns:** Each table stores a distinct aspect of inventory data.
- **Avoids Redundant Data:** Prices and pax categories are stored separately.
- **Optimized Querying:** Faster lookups without scanning unnecessary fields.

---


