# Airline System API Documentation

## Base URL
```
http://localhost:${PORT}/api
```

## Authentication
Most endpoints require authentication using JWT token. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Error Responses
All endpoints may return these error responses:
```json
{
    "status": "ERROR",
    "message": "Error message description"
}
```

---

####################### Airlines API #######################
>>============================================================<<
||                                                            ||
||                                                            ||
||                                                            ||
||          _      _ _                            _____ _____ ||
||    /\   (_)    | (_)                     /\   |  __ \_   _|||
||   /  \   _ _ __| |_ _ __   ___  ___     /  \  | |__) || |  ||
||  / /\ \ | | '__| | | '_ \ / _ \/ __|   / /\ \ |  ___/ | |  ||
|| / ____ \| | |  | | | | | |  __/\__ \  / ____ \| |    _| |_ ||
||/_/    \_\_|_|  |_|_|_| |_|\___||___/ /_/    \_\_|   |_____|||
||                                                            ||
||                                                            ||
||                                                            ||
>>============================================================<<



### Get All Airlines
Get a list of all airlines.

- **URL**: `/airlines`
- **Method**: `GET`
- **Auth**: Required
- **Access**: All authenticated users
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `sort`: Sort field (e.g., "name", "-name" for descending)
  - `fields`: Comma-separated fields to include

**Success Response**:
```json
{
    "status": "SUCCESS",
    "result": {
        "currentPage": 1,
        "limit": 10,
        "numberOfPages": 1,
        "nextPage": null,
        "previousPage": null
    },
    "data": {
        "airlines": [{
            "name": "Airline Name",
            "description": "Airline Description",
            "country": "Country Name",
            "logo": "logo_url",
            "owner": "user_id"
        }]
    }
}
```

### Get Specific Airline
Get details of a specific airline.

- **URL**: `/airlines/:id`
- **Method**: `GET`
- **Auth**: Required
- **Access**: All authenticated users

**Success Response**:
```json
{
    "status": "SUCCESS",
    "data": {
        "airline": {
            "name": "Airline Name",
            "description": "Airline Description",
            "country": "Country Name",
            "logo": "logo_url",
            "owner": "user_id"
        }
    }
}

### Get my Airline 
Get airline owner airline

- **URL**: `/airlines/myAirline`
- **Method**: `GET`
- **Auth**: Required
- **Access**: airline owner

**Success Response**:
```json
{
    "status": "SUCCESS",
    "data": {
        "airline": {
            "name": "Airline Name",
            "description": "Airline Description",
            "country": "Country Name",
            "logo": "logo_url",
            "owner": "user_id"
        }
    }
}
```
```

### Create Airline
Create a new airline.

- **URL**: `/airlines`
- **Method**: `POST`
- **Auth**: Required
- **Access**: Admin, Airline Owner
- **Content-Type**: `multipart/form-data`

**Request Body**:
```json
{
    "name": "Airline Name",
    "description": "Airline Description",
    "country": "Country Name",
    "logo": "file_upload"
}
```

**Success Response**:
```json
{
    "status": "SUCCESS",
    "data": {
        "airline": {
            "name": "Airline Name",
            "description": "Airline Description",
            "country": "Country Name",
            "logo": "logo_url",
            "owner": "user_id" // not sended , auto filled from logged user
        }
    }
}
```

### Update Airline
Update airline details.

- **URL**: `/airlines/myAirline`
- **Method**: `PUT`
- **Auth**: Required
- **Access**: Airline Owner
- **Content-Type**: `multipart/form-data`

**Request Body**:
```json
{
    "name": "Updated Name",
    "description": "Updated Description",
    "country": "Updated Country",
    "logo": "file_upload"
}
```

**Success Response**:
```json
{
    "status": "SUCCESS",
    "data": {
        "airline": {
            "name": "Updated Name",
            "description": "Updated Description",
            "country": "Updated Country",
            "logo": "updated_logo_url",
            "owner": "user_id"
        }
    }
}


```

---

###################### Planes API ##############################
>>=============================================================<<
||                                                             ||
||                                                             ||
||                                                             ||
||    _____  _                                  _____ _____    ||
||   |  __ \| |                           /\   |  __ \_   _|   ||
||   | |__) | | __ _ _ __   ___  ___     /  \  | |__) || |     ||
||   |  ___/| |/ _` | '_ \ / _ \/ __|   / /\ \ |  ___/ | |     ||
||   | |    | | (_| | | | |  __/\__ \  / ____ \| |    _| |_    ||
||   |_|    |_|\__,_|_| |_|\___||___/ /_/    \_\_|   |_____|   ||
||                                                             ||
||                                                             ||
||                                                             ||
>>=============================================================<<

### Get All Planes (Airline Owner)
Get all planes belonging to the logged-in airline owner.

- **URL**: `/planes/myPlanes`
- **Method**: `GET`
- **Auth**: Required
- **Access**: Airline Owner

**Success Response**:
```json
{
    "status": "SUCCESS",
    "data": [{
        "model": "Plane Model",
        "registrationNumber": "ABC123",
        "airline": "airline_id",
        "seatsEconomy": 100,
        "seatsBusiness": 20,
        "status": "availableToFlight",
        "currentLocation": "Country Name"
    }]
}
```

### Get Specific Plane
Get details of a specific plane.

- **URL**: `/planes/:id`
- **Method**: `GET`
- **Auth**: Required
- **Access**: Airline Owner (only their planes)

**Success Response**:
```json
{
    "status": "SUCCESS",
    "data": {
        "model": "Plane Model",
        "registrationNumber": "ABC123",
        "airline": "airline_id",
        "seatsEconomy": 100,
        "seatsBusiness": 20,
        "status": "availableToFlight",
        "currentLocation": "Country Name"
    }
}
```

### Create Plane
Create a new plane.

- **URL**: `/planes`
- **Method**: `POST`
- **Auth**: Required
- **Access**: Airline Owner

**Request Body**:
```json
{
    "model": "Plane Model",
    "registrationNumber": "ABC123",
    "seatsEconomy": 100,
    "seatsBusiness": 20,
    "currentLocation": "Country Name" // not sended , auto filled by airline country
}
```

**Success Response**:
```json
{
    "status": "SUCCESS",
    "data": {
        "model": "Plane Model",
        "registrationNumber": "ABC123",
        "airline": "airline_id",
        "seatsEconomy": 100,
        "seatsBusiness": 20,
        "status": "availableToFlight", // auto filled [defalut]
        "currentLocation": "Country Name"
    }
}
```

### Update Plane
Update plane details. Note: You cannot update airline or status fields.

- **URL**: `/planes/:id`
- **Method**: `PUT`
- **Auth**: Required
- **Access**: Airline Owner (only their planes)

**Request Body**:
```json
{
    "model": "Updated Model",
    "registrationNumber": "XYZ789",
    "seatsEconomy": 120,
    "seatsBusiness": 30,
    "currentLocation": "New Country"
}
```

**Validation Rules**:
- Cannot update airline field
- Cannot update status field (use `/planes/:id/status` endpoint instead)
- seatsEconomy must be between 0 and 150
- seatsBusiness must be between 0 and 150
- registrationNumber must be 3-50 characters
- model must be 3-50 characters

**Success Response**:
```json
{
    "status": "SUCCESS",
    "data": {
        "model": "Updated Model",
        "registrationNumber": "XYZ789",
        "airline": "airline_id", // unchanged
        "seatsEconomy": 120,
        "seatsBusiness": 30,
        "status": "availableToFlight", // unchanged
        "currentLocation": "New Country"
    }
}

```

### Update Plane Status
Update plane status.

- **URL**: `/planes/:id/status`
- **Method**: `PUT`
- **Auth**: Required
- **Access**: Airline Owner

**Request Body**:
```json
{
    "status": "maintenance"  // availableToFlight, maintenance, inFlight
}
```

**Success Response**:
```json
{
    "status": "SUCCESS",
    "data": {
        "status": "maintenance"
    }
}
```

---

######################## Flights API ###########################
>>=============================================================<<
||                                                             ||
||                                                             ||
||                                                             ||
||    ______ _ _       _     _                  _____ _____    ||
||   |  ____| (_)     | |   | |           /\   |  __ \_   _|   ||
||   | |__  | |_  __ _| |__ | |_ ___     /  \  | |__) || |     ||
||   |  __| | | |/ _` | '_ \| __/ __|   / /\ \ |  ___/ | |     ||
||   | |    | | | (_| | | | | |_\__ \  / ____ \| |    _| |_    ||
||   |_|    |_|_|\__, |_| |_|\__|___/ /_/    \_\_|   |_____|   ||
||                __/ |                                        ||
||               |___/                                         ||
||                                                             ||
||                                                             ||
||                                                             ||
>>=============================================================<<


### Get All Flights
Get a list of all flights.

- **URL**: `/flights`
- **Method**: `GET`
- **Auth**: Required
- **Access**: All authenticated users [for user it return all flights but for airlineOwner it return his airline flights]
- **Query Parameters**:
  - `departureCity`: Filter by departure city
  - `arrivalCity`: Filter by arrival city
  - `departureDate`: Filter by departure date
- `returnDate`: Filter by return Date 
  - `airlineName`: Filter by airline name
  - `page`: Page number
  - `limit`: Items per page

**Success Response**:
```json
{
    "status": "SUCCESS",
    "pagination": {
        "currentPage": 1,
        "limit": 10,
        "numberOfPages": 1
    },
    "data": [{
        "airline": {
            "name": "Airline Name",
            "logo": "logo_url"
        },
        "departureDate": "2024-03-20T10:00:00Z",
        "arrivalDate": "2024-03-20T12:00:00Z",
        "duration": 120,
        "priceEconomy": 200,
        "priceBusiness": 500,
        "departureAirport": {
            "name": "Airport Name",
            "city": "City Name",
            "country": "Country Name"
        },
        "arrivalAirport": {
            "name": "Airport Name",
            "city": "City Name",
            "country": "Country Name"
        }
    }]
}
```

### Get Airline Flights
Get all flights for a specific airline.

- **URL**: `/airlines/:airlineId/flights`
- **Method**: `GET`
- **Auth**: Required
- **Access**: All authenticated users
- **Query Parameters**:
  - `departureCity`: Filter by departure city
  - `arrivalCity`: Filter by arrival city
  - `departureDate`: Filter by departure date (YYYY-MM-DD)
  - `page`: Page number
  - `limit`: Items per page
  - `sort`: Sort field (e.g., "departureDate", "-departureDate" for descending)

**Note**: Only returns outbound flights (tripType: 'outbound') and pending status flights

**Success Response**:
```json
{
    "status": "SUCCESS",
    "pagination": {
        "currentPage": 1,
        "limit": 10,
        "numberOfPages": 1
    },
    "data": [{
        "airline": {
            "name": "Airline Name",
            "logo": "logo_url"
        },
        "departureDate": "2024-03-20T10:00:00Z",
        "arrivalDate": "2024-03-20T12:00:00Z",
        "duration": 120,
        "priceEconomy": 200,
        "priceBusiness": 500,
        "departureAirport": {
            "name": "Airport Name",
            "city": "City Name",
            "country": "Country Name"
        },
        "arrivalAirport": {
            "name": "Airport Name",
            "city": "City Name",
            "country": "Country Name"
        },
        "status": "pending",
        "tripType": "outbound"
    }]
}
```
```

### Get Specific Flight
Get details of a specific flight.

- **URL**: `/flights/:id`
- **Method**: `GET`
- **Auth**: Required
- **Access**: All authenticated users

**Success Response**:
```json
{
    "status": "SUCCESS",
    "data": {
        "flight": {
            "airline": "airline_id",
            "plane": "plane_id",
            "flightNumber": "AB123",
            "departureCountry": {
                "name": "Country Name",
                "code": "CN"
            },
            "departureAirport": {
                "name": "Airport Name",
                "iata": "ABC",
                "city": "City Name",
                "country": "Country Name"
            },
            "departureDate": "2024-03-20T10:00:00Z",
            "arrivalCountry": {
                "name": "Country Name",
                "code": "CN"
            },
            "arrivalAirport": {
                "name": "Airport Name",
                "iata": "XYZ",
                "city": "City Name",
                "country": "Country Name"
            },
            "arrivalDate": "2024-03-20T12:00:00Z",
            "priceEconomy": 200,
            "priceBusiness": 500,
            "status": "pending",
            "seatMap": [{
                "seatNumber": "A1",
                "type": "business",
                "isBooked": false
            }],
            "duration": 120,
            "tripType": "outbound",
            "returnFlight": "return_flight_id"
        }
    }
}
```

### Update Flight
Update flight details. Note: Some fields cannot be updated for security and business logic reasons.

- **URL**: `/flights/:id`
- **Method**: `PUT`
- **Auth**: Required
- **Access**: Airline Owner (only their flights)

**Updatable Fields**:
- `plane` - Must be available and have same seat configuration as current plane
- `departureAirport` - Must be in the same country as current departure country
- `arrivalAirport` - Must be in the same country as current arrival country
- `departureDate` - Must be at least 24 hours after current departure date
- `duration` - Flight duration in minutes
- `priceEconomy` - Economy class price
- `priceBusiness` - Business class price

**Non-Updatable Fields**:
- `airline`
- `departureCountry`
- `arrivalCountry`
- `flightNumber`
- `arrivalDate` (auto-calculated from departureDate and duration)
- `arrivalCountry`
- `seatMap`

**Request Body**:
```json
{
    "plane": "plane_id",
    "departureAirport": "Airport Name",
    "arrivalAirport": "Airport Name",
    "departureDate": "2024-03-20T10:00:00Z",
    "duration": 120,
    "priceEconomy": 200,
    "priceBusiness": 500
}
```

**Success Response**:
```json
{
    "status": "SUCCESS",
    "data": {
        "airline": "airline_id", // unchanged
        "plane": "new_plane_id",
        "flightNumber": "AB123", // unchanged
        "departureCountry": {
            "name": "Country Name",
            "code": "CN"
        },
        "departureAirport": {
            "name": "New Airport Name",
            "iata": "ABC",
            "city": "City Name",
            "country": "Country Name"
        },
        "departureDate": "2024-03-20T10:00:00Z",
        "arrivalCountry": {
            "name": "Country Name",
            "code": "CN"
        },
        "arrivalAirport": {
            "name": "New Airport Name",
            "iata": "XYZ",
            "city": "City Name",
            "country": "Country Name"
        },
        "arrivalDate": "2024-03-20T12:00:00Z", // auto-calculated
        "priceEconomy": 200,
        "priceBusiness": 500,
        "status": "pending",
        "duration": 120,
        "tripType": "outbound" // unchanged
    }
}
```

**Validation Rules**:
1. New plane must:
   - Belong to the same airline
   - Be available for flight
   - Have identical seat configuration as current plane
2. New airports must:
   - Be in the same country as current departure/arrival countries
   - Exist in the European airports database
3. New departure date must:
   - Be at least 24 hours after current departure date
   - Be in the future
4. Prices must be positive numbers
5. Duration must be positive number in minutes


### Create Flight
Create a new flight (creates both outbound and return flights).

- **URL**: `/flights`
- **Method**: `POST`
- **Auth**: Required
- **Access**: Airline Owner

**Request Body**:
```json
{
    "plane": "plane_id",
    "departureCountry": "Country Name",
    "departureAirport": "Airport Name",
    "departureDate": "2024-03-20T10:00:00Z",
    "arrivalCountry": "Country Name",
    "arrivalAirport": "Airport Name",
    "returnDepartureDate": "2024-03-27T10:00:00Z",
    "priceEconomy": 200,
    "priceBusiness": 500,
    "duration": 120
}
```

**Success Response**:
```json
{
    "status": "SUCCESS",
    "data": {
        "outboundFlight": {
            // Flight details
        },
        "returnFlight": {
            // Return flight details
        }
    }
}
```

### Cancel Flight
Cancel a flight.

- **URL**: `/flights/:id/cancel`
- **Method**: `PUT`
- **Auth**: Required
- **Access**: Airline Owner

**Success Response**:
```json
{
    "status": "SUCCESS",
    "message": "Flight cancelled successfully"
}
```

---

################### Flight Tickets API ############################
>>==============================================================<<
||                                                              ||
||                                                              ||
||                                                              ||
||    _______ _      _        _                  _____ _____    ||
||   |__   __(_)    | |      | |           /\   |  __ \_   _|   ||
||      | |   _  ___| | _____| |_ ___     /  \  | |__) || |     ||
||      | |  | |/ __| |/ / _ \ __/ __|   / /\ \ |  ___/ | |     ||
||      | |  | | (__|   <  __/ |_\__ \  / ____ \| |    _| |_    ||
||      |_|  |_|\___|_|\_\___|\__|___/ /_/    \_\_|   |_____|   ||
||                                                              ||
||                                                              ||
||                                                              ||
>>==============================================================<<
### Create Ticket
Book a ticket for a flight.

- **URL**: `/flights/:flightId/tickets`
- **Method**: `POST`
- **Auth**: Required
- **Access**: User

**Request Body**:
```json
{
    "seats": [{
        "seatNumber": "B1"
    }, {
        "seatNumber": "B2"
    }]
}
```

**Success Response**:
```json
{
    "status": "SUCCESS",
    "data": {
        "outboundFlight": "flight_id",
        "returnFlight": "return_flight_id",
        "bookedSeats": [{
            "seatNumber": "B1",
            "type": "business"
        }, {
            "seatNumber": "B2",
            "type": "business"
        }],
        "status": "active",
        "finalPrice": 1000,
        "user": "user_id",
        "airline": "airline_id"
    }
}
```

### Get My Tickets
Get all tickets for the logged-in user.

- **URL**: `/flightTickets/myTickets`
- **Method**: `GET`
- **Auth**: Required
- **Access**: User, Admin, Airline Owner [if role is user its return all valid tickets for user ]
if role is airline owner it return all tickets for his airline

**Success Response**:
```json
{
    "status": "SUCCESS",
    "result": {
        "currentPage": 1,
        "limit": 10,
        "numberOfPages": 1
    },
    "data": {
        "flighttickets": [{
            "outboundFlight": "flight_id",
            "returnFlight": "return_flight_id",
            "bookedSeats": [{
                "seatNumber": "B1",
                "type": "business"
            }],
            "status": "active",
            "finalPrice": 500,
            "user": "user_id",
            "airline": "airline_id"
        }]
    }
}
```

### Cancel Ticket
Cancel a ticket.

- **URL**: `/flightTickets/:id/cancel`
- **Method**: `PUT`
- **Auth**: Required
- **Access**: User (ticket owner)

**Success Response**:
```json
{
    "status": "SUCCESS",
    "message": "Ticket cancelled successfully"
}
```

### Get Flight Tickets (Airline Owner)
Get all tickets for a specific flight.

- **URL**: `/flightTickets/flight/:flightId/tickets`
- **Method**: `GET`
- **Auth**: Required
- **Access**: Airline Owner

**Success Response**:
```json
{
    "status": "SUCCESS",
    "data": [{
        "outboundFlight": "flight_id",
        "returnFlight": "return_flight_id",
        "bookedSeats": [{
            "seatNumber": "B1",
            "type": "business"
        }],
        "status": "active",
        "finalPrice": 500,
        "user": "user_id",
        "airline": "airline_id"
    }]
}
```

## Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Notes

1. All dates should be in ISO format
2. Prices are in the default currency unit
3. Flight statuses: pending, onTheWay, successful, cancelled
4. Plane statuses: availableToFlight, maintenance, inFlight
5. Ticket statuses: active, expired, cancelled
6. Seat numbers format:
   - Business class: B1, B2, B3, etc.
   - Economy class: E1, E2, E3, etc. 