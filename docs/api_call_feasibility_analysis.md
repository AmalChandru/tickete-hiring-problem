# API Call Feasibility Analysis

## 1. API Calls Per Day Calculation
Since each record requires an individual API call (no batching), we calculate the total number of records created per day, as every record translates to an API request.

### Every 4 Hours – Fetch Next 7 Days
- Runs **6 times per day**.
- Each run fetches **7 days × 450 records per day**.
- **Total API calls per day:**  
  \[
  6 \times 7 \times 450 = 18,900 \text{ API calls per day}
  \]

### Every 1 Day – Fetch Next 30 Days
- Runs **1 time per day**.
- Each run fetches **30 days × 450 records per day**.
- **Total API calls per day:**  
  \[
  1 \times 30 \times 450 = 13,500 \text{ API calls per day}
  \]

### Every 15 Minutes – Fetch Today's Availability
- Runs **96 times per day** (1440 minutes / 15 = 96).
- Each run fetches **450 records**.
- **Total API calls per day:**  
  \[
  96 \times 450 = 43,200 \text{ API calls per day}
  \]

### Total API Calls Per Day
  \[
  18,900 + 13,500 + 43,200 = 75,600 \text{ API calls per day}
  \]

## 2. Feasibility with API Rate Limits
- **API Rate Limit:** 30 requests per minute.
- **Available API Calls Per Day:**
  \[
  30 \times 60 \times 24 = 43,200 \text{ API calls per day}
  \]
- **Required API Calls:** 75,600 per day.
- **We exceed the limit by 32,400 API calls per day, making this approach infeasible.**

## 3. Problem: Exceeding Rate Limit
Since we need **75,600 API calls/day** but can only make **43,200/day**, we are **exceeding the limit by 32,400 API calls/day**.

## 4. Potential Solutions
Since **batching is NOT an option**, potential optimizations include:

1. **Reduce Polling Frequency** → Adjust the **15-minute poller** to **30 minutes** or **hourly**.
2. **Distribute Load Over Multiple API Keys** → If allowed, acquire more API credentials.
3. **Sync Less Data** → Prioritize only the most critical data.
4. **Request a Rate Limit Increase** → Check with the API provider for higher limits.
5. **Use a Smarter Refresh Strategy** → Instead of fetching everything on every poll, only update changed data.

## 5. Final Conclusion
**Currently NOT feasible** as **75,600 API calls/day exceeds the 43,200 API limit**.
🔹 **Optimization is required through polling adjustments, rate limit requests, or smarter data fetching strategies.**

