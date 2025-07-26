# Hotel Management Dashboard Statistics API Documentation

## Overview
This API provides comprehensive statistics and analytics for hotel managers to monitor their hotel performance, bookings, revenue, and room availability.

## Base URL
```
/api/hotel-statistics
```

## Authentication
All endpoints require authentication with a valid JWT token and `hotelManager` role.

## Endpoints

### 1. Dashboard Overview
**GET** `/dashboard/overview`

Returns comprehensive dashboard data including all Phase 1 statistics in a single request.

**Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "kpis": {
      "totalRevenue": 15000.50,
      "totalBookings": 45,
      "occupancyRate": 75.5,
      "averageDailyRate": 120.25,
      "revenuePerAvailableRoom": 90.75
    },
    "bookingDistribution": {
      "pending_payment": 5,
      "paid": 35,
      "failed": 5
    },
    "roomStats": {
      "totalRooms": 20,
      "availableRooms": 5,
      "occupiedRooms": 15,
      "roomTypeDistribution": {
        "Single": { "total": 8, "available": 2, "occupied": 6 },
        "Double": { "total": 10, "available": 3, "occupied": 7 },
        "Suite": { "total": 2, "available": 0, "occupied": 2 }
      }
    },
    "revenueTrend": [
      {
        "year": 2024,
        "month": 1,
        "revenue": 5000.00,
        "bookings": 15
      }
    ],
    "hotelPerformance": [
      {
        "hotelId": "507f1f77bcf86cd799439011",
        "hotelName": "Grand Hotel",
        "totalRevenue": 10000.00,
        "totalBookings": 25,
        "averageBookingValue": 400.00,
        "totalRooms": 15,
        "occupancyRate": 80.0
      }
    ]
  }
}
```

### 2. Key Performance Indicators (KPIs)
**GET** `/kpis`

Returns basic KPIs for the hotel manager.

**Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "totalRevenue": 15000.50,
    "totalBookings": 45,
    "occupancyRate": 75.5,
    "averageDailyRate": 120.25,
    "revenuePerAvailableRoom": 90.75
  }
}
```

**KPI Definitions:**
- `totalRevenue`: Sum of all paid bookings
- `totalBookings`: Total number of bookings (all statuses)
- `occupancyRate`: Percentage of rooms occupied (0-100)
- `averageDailyRate`: Average price per room per night
- `revenuePerAvailableRoom`: Total revenue divided by total rooms

### 3. Booking Status Distribution
**GET** `/bookings/status-distribution`

Returns the distribution of bookings by status.

**Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "pending_payment": 5,
    "paid": 35,
    "failed": 5
  }
}
```

### 4. Room Availability Statistics
**GET** `/rooms/availability`

Returns detailed room availability and type distribution.

**Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "totalRooms": 20,
    "availableRooms": 5,
    "occupiedRooms": 15,
    "roomTypeDistribution": {
      "Single": { "total": 8, "available": 2, "occupied": 6 },
      "Double": { "total": 10, "available": 3, "occupied": 7 },
      "Suite": { "total": 2, "available": 0, "occupied": 2 }
    }
  }
}
```

### 5. Monthly Revenue Trend
**GET** `/revenue/monthly-trend`

Returns monthly revenue and booking trends for the last 12 months.

**Response:**
```json
{
  "status": "SUCCESS",
  "data": [
    {
      "year": 2024,
      "month": 1,
      "revenue": 5000.00,
      "bookings": 15
    },
    {
      "year": 2024,
      "month": 2,
      "revenue": 6000.00,
      "bookings": 18
    }
  ]
}
```

### 6. Hotel Performance Comparison
**GET** `/hotels/performance-comparison`

Returns performance comparison for managers with multiple hotels.

**Response:**
```json
{
  "status": "SUCCESS",
  "data": [
    {
      "hotelId": "507f1f77bcf86cd799439011",
      "hotelName": "Grand Hotel",
      "totalRevenue": 10000.00,
      "totalBookings": 25,
      "averageBookingValue": 400.00,
      "totalRooms": 15,
      "occupancyRate": 80.0
    },
    {
      "hotelId": "507f1f77bcf86cd799439012",
      "hotelName": "City Hotel",
      "totalRevenue": 5000.50,
      "totalBookings": 20,
      "averageBookingValue": 250.00,
      "totalRooms": 10,
      "occupancyRate": 70.0
    }
  ]
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "status": "ERROR",
  "message": "You are not authorized to access this resource"
}
```

### 403 Forbidden
```json
{
  "status": "ERROR",
  "message": "Access denied. Hotel manager role required."
}
```

### 500 Internal Server Error
```json
{
  "status": "ERROR",
  "message": "Internal server error"
}
```

## Usage Examples

### Frontend Integration Example (JavaScript)
```javascript
// Get dashboard overview
const getDashboardData = async () => {
  try {
    const response = await fetch('/api/hotel-statistics/dashboard/overview', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }
};

// Get specific KPIs
const getKPIs = async () => {
  try {
    const response = await fetch('/api/hotel-statistics/kpis', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching KPIs:', error);
  }
};
```

### React Hook Example
```javascript
import { useState, useEffect } from 'react';

const useHotelStatistics = (endpoint) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/hotel-statistics/${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
};
```

## Phase 1 Features

### ✅ Implemented
- Basic KPIs (Revenue, Bookings, Occupancy Rate, ADR, RevPAR)
- Booking Status Distribution
- Room Availability Statistics
- Monthly Revenue Trends
- Hotel Performance Comparison
- Comprehensive Dashboard Overview

### 🔄 Future Phases (Scalable Architecture)
- **Phase 2**: Advanced Analytics
  - Time-based trends with filters
  - Room type performance analysis
  - Customer behavior analytics
  - Seasonal pattern analysis

- **Phase 3**: Predictive Analytics
  - Demand forecasting
  - Revenue optimization suggestions
  - Booking pattern predictions
  - Dynamic pricing recommendations

## Notes
- All monetary values are returned as numbers (not strings)
- Percentages are returned as numbers (0-100 range)
- Dates are returned in ISO format
- The API is designed to be scalable for future phases without breaking existing functionality
- All statistics are calculated based on the authenticated hotel manager's hotels only 