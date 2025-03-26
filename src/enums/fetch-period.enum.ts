export enum FetchPeriod {
    DAILY = 0, // Every 1 day fetch availability for the next 30 days
    FOUR_HOURS = 1, // Every 4 hours fetch availability for the next 7 days
    FIFTEEN_MINUTES = 2, // Every 15 minutes fetch availability for today 
}

export enum FetchStatus {
  PENDING = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  FAILED = 3,
}
  