# Hotel Management Dashboard Statistics

## Overview
The Hotel Management Dashboard Statistics is a comprehensive analytics system designed to provide hotel managers with real-time insights into their hotel performance, bookings, revenue, and room availability.

## 🚀 Phase 1 Implementation

### Features Implemented
- ✅ **Key Performance Indicators (KPIs)**
  - Total Revenue
  - Total Bookings
  - Occupancy Rate
  - Average Daily Rate (ADR)
  - Revenue Per Available Room (RevPAR)

- ✅ **Booking Analytics**
  - Booking Status Distribution
  - Monthly Revenue Trends
  - Hotel Performance Comparison

- ✅ **Room Management**
  - Room Availability Statistics
  - Room Type Distribution
  - Occupancy Analysis

- ✅ **Comprehensive Dashboard**
  - All statistics in a single API call
  - Optimized for frontend dashboard integration

## 📁 File Structure

```
services/Hotels/
├── hotelStatisticsService.js    # Core statistics service
└── ...

routes/Hotels/
├── hotelStatisticsRoute.js      # API routes for statistics
└── ...

api_Doc_for_hotel_statistics.md  # Complete API documentation
test_hotel_statistics.js         # Test and example usage
HOTEL_STATISTICS_README.md       # This file
```

## 🔧 Installation & Setup

### 1. Files Added
The following files have been added to your project:
- `services/Hotels/hotelStatisticsService.js`
- `routes/Hotels/hotelStatisticsRoute.js`
- `api_Doc_for_hotel_statistics.md`
- `test_hotel_statistics.js`

### 2. Routes Integration
The statistics routes have been automatically integrated into your `app.js`:
```javascript
app.use('/api/hotel-statistics', hotelStatisticsRouter);
```

### 3. Authentication
All endpoints require:
- Valid JWT token
- `hotelManager` role

## 📊 API Endpoints

### Base URL: `/api/hotel-statistics`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dashboard/overview` | GET | Complete dashboard data |
| `/kpis` | GET | Key Performance Indicators |
| `/bookings/status-distribution` | GET | Booking status breakdown |
| `/rooms/availability` | GET | Room availability stats |
| `/revenue/monthly-trend` | GET | Monthly revenue trends |
| `/hotels/performance-comparison` | GET | Hotel performance comparison |

## 🎯 Usage Examples

### Frontend Integration

```javascript
// Get complete dashboard data
const getDashboardData = async () => {
  const response = await fetch('/api/hotel-statistics/dashboard/overview', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Get specific KPIs
const getKPIs = async () => {
  const response = await fetch('/api/hotel-statistics/kpis', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
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

## 🏗️ Architecture

### Scalable Design
The system is designed with scalability in mind:

1. **Modular Service Class**: `HotelStatisticsService` contains all business logic
2. **Separate Route Layer**: Clean separation of concerns
3. **Future-Proof Structure**: Easy to add new statistics without breaking existing code

### Service Class Structure
```javascript
class HotelStatisticsService {
  static async getHotelManagerKPIs(userId) { /* ... */ }
  static async getBookingStatusDistribution(userId) { /* ... */ }
  static async getRoomAvailabilityStats(userId) { /* ... */ }
  static async getMonthlyRevenueTrend(userId) { /* ... */ }
  static async getHotelPerformanceComparison(userId) { /* ... */ }
}
```

## 🔮 Future Phases

### Phase 2: Advanced Analytics
- Time-based trends with filters
- Room type performance analysis
- Customer behavior analytics
- Seasonal pattern analysis

### Phase 3: Predictive Analytics
- Demand forecasting
- Revenue optimization suggestions
- Booking pattern predictions
- Dynamic pricing recommendations

## 🧪 Testing

### Running Tests
1. Ensure MongoDB is running
2. Have test data in your database
3. Update `mockUserId` in `test_hotel_statistics.js`
4. Run the test file:

```bash
node test_hotel_statistics.js
```

### Test Coverage
- ✅ KPI calculations
- ✅ Booking status distribution
- ✅ Room availability statistics
- ✅ Monthly revenue trends
- ✅ Hotel performance comparison
- ✅ Error handling

## 📈 Key Metrics Explained

### KPIs
- **Total Revenue**: Sum of all paid bookings
- **Total Bookings**: Count of all bookings (all statuses)
- **Occupancy Rate**: Percentage of rooms occupied (0-100%)
- **Average Daily Rate**: Average price per room per night
- **Revenue Per Available Room**: Total revenue / total rooms

### Business Insights
- **Booking Status Distribution**: Monitor payment success rates
- **Room Type Performance**: Identify most profitable room types
- **Monthly Trends**: Track seasonal patterns
- **Hotel Comparison**: Compare performance across multiple hotels

## 🔒 Security & Performance

### Security Features
- JWT authentication required
- Role-based access control (`hotelManager` only)
- Data isolation (managers only see their hotels)

### Performance Optimizations
- MongoDB aggregation pipelines for efficient queries
- Parallel data fetching in dashboard overview
- Indexed queries on hotel manager relationships
- Caching-ready structure for future implementation

## 🐛 Troubleshooting

### Common Issues

1. **No Data Returned**
   - Check if user has `hotelManager` role
   - Verify user has associated hotels
   - Ensure hotels have rooms and bookings

2. **Authentication Errors**
   - Verify JWT token is valid
   - Check token expiration
   - Ensure correct role permissions

3. **Performance Issues**
   - Check MongoDB indexes
   - Monitor aggregation pipeline performance
   - Consider implementing caching for large datasets

### Debug Mode
Enable debug logging by adding to your environment:
```bash
DEBUG=hotel-statistics:*
```

## 📞 Support

For questions or issues:
1. Check the API documentation: `api_Doc_for_hotel_statistics.md`
2. Review the test examples: `test_hotel_statistics.js`
3. Check the service implementation: `services/Hotels/hotelStatisticsService.js`

## 🎉 Success Metrics

After implementation, you should see:
- ✅ Hotel managers can access comprehensive dashboard
- ✅ Real-time statistics updates
- ✅ Improved decision-making capabilities
- ✅ Better revenue optimization
- ✅ Enhanced room management efficiency

---

**Note**: This implementation is designed to be backward-compatible and won't affect existing hotel management functionality. All new features are additive and follow the existing code patterns in your application. 