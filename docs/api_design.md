# Experience API Documentation

## Overview
This document provides details about the Experience API endpoints, which include:

- **Slot Availability API** - Fetches available slots for a given product and date.
- **Available Dates API** - Returns all available dates for a product within the next 60 days.

## Endpoints

### 1. Slot Availability API

**Endpoint:**  
`GET /api/v1/experience/{id}/slots?date={date}`

**Description:**  
Fetches available slots for the given product ID and date.

#### Request Parameters:
| Parameter | Type   | Required | Description                  |
|-----------|--------|----------|------------------------------|
| id        | Number | Yes      | Product ID                   |
| date      | String | Yes      | Date in YYYY-MM-DD format    |

#### Response Format:
```json
{
  "status": "success",
  "data": [
    {
      "startDate": "2025-03-29",
      "startTime": "04:00",
      "endTime": "04:00",
      "remaining": 2000,
      "paxAvailability": [
        {
          "max": 20,
          "min": 1,
          "remaining": 1000,
          "type": "ADULT_12~99",
          "category": "Adult",
          "description": "12-99 years",
          "price": {
            "discount": 0,
            "finalPrice": 212.14,
            "originalPrice": 312.14,
            "currencyCode": "SGD"
          }
        }
      ]
    }
  ]
}
```

#### Response Codes:
| Status Code | Description                                  |
|------------|----------------------------------------------|
| 200 OK     | Successfully retrieved slot availability    |
| 400 Bad Request | Invalid parameters                     |
| 404 Not Found | No slots available for the given product and date |
| 500 Internal Server Error | Server error encountered     |

---

### 2. Available Dates API

**Endpoint:**  
`GET /api/v1/experience/{id}/dates`

**Description:**  
Returns all available dates for a product within the next 60 days.

#### Request Parameters:
| Parameter | Type   | Required | Description  |
|-----------|--------|----------|--------------|
| id        | Number | Yes      | Product ID   |

#### Response Format:
```json
{
  "status": "success",
  "data": [
    {
      "date": "2025-03-29",
      "price": {
        "currencyCode": "SGD",
        "discount": 0,
        "finalPrice": 212.14,
        "originalPrice": 312.14
      }
    },
    {
      "date": "2025-03-30",
      "price": {
        "currencyCode": "SGD",
        "discount": 0,
        "finalPrice": 242.14,
        "originalPrice": 342.14
      }
    }
  ]
}
```

#### Response Codes:
| Status Code | Description                                  |
|------------|----------------------------------------------|
| 200 OK     | Successfully retrieved available dates       |
| 400 Bad Request | Invalid parameters                     |
| 404 Not Found | No available dates found                 |
| 500 Internal Server Error | Server error encountered     |

## Notes
- Date values are stored as strings in `YYYY-MM-DD` format.
- The API ensures that dates returned do not exceed the next 60 days from today.
- Prices are fetched from the price table based on the associated slot data.

