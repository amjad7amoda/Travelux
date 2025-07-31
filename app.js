//====== Application Imports =======//
const express = require('express');
const cors = require('cors');

const app = express();
const env = require('dotenv');
const path = require('node:path');
const dbconnection = require('./config/database');
const globalErrorHandler = require('./middlewares/globalErrorHandler');

const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const hotelRouter = require('./routes/Hotels/hotelRoute');
const roomRouter = require('./routes/Hotels/roomRoute');
const hotelBookingRouter = require('./routes/Hotels/hotelBookingRoute');
const hotelStatisticsRouter = require('./routes/Hotels/hotelStatisticsRoute');
const airlineRouter = require('./routes/airlineRoute');
const planeRouter = require('./routes/planeRoute');
const flightRouter = require('./routes/flightRoute');
const citiesRouter = require('./routes/citiesRoute');
const serverStatusRouter = require('./routes/serverStatusRoute');
const stationRouter = require('./routes/Trains/stationRoute');
const trainRouter = require('./routes/Trains/trainRoute');
const routeRouter = require('./routes/Trains/routeRoute');
const trainTripRouter = require('./routes/Trains/trainTripRoute');
const trainTripBookingRouter = require('./routes/Trains/trainTripBookingRoute');
const flightTicketRouter = require('./routes/flightTicketRoute');
const carRentalOfficeRoute = require('./routes/Cars/carRentalOfficeRoute');
const publicCarRoute = require('./routes/Cars/publicCarRoute');
const officeCarRoute = require('./routes/Cars/officeCarRoute');
const carBookingRoute = require('./routes/Cars/carBookingRoute');
const userFcmTokenRouter = require('./routes/userFcmTokenRoute');
const myNotificationRouter = require('./routes/myNotificationRoute');

const scheduleTrainStatusCheck = require('./utils/jobs/updateTrainStatus');
const scheduleFlightStatusCheck = require('./utils/jobs/updateFlightStatus');
const scheduleCarStatusCheck = require('./utils/jobs/updateCarStatus');
const scheduleHotelRoomStatusCheck = require('./utils/jobs/updateHotelRoomStatus');

const couponRouter = require('./routes/Payments/couponRoute');
const cartRouter = require('./routes/Payments/cartRoute');

//======== Config Requirement ========//
env.config();
dbconnection();

process.env.BASE_URL = `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}`;
app.use(express.static(path.join(__dirname, 'uploads')));

//======== Middlewares =========//
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());

//======== Jobs ===========//
scheduleTrainStatusCheck();
scheduleFlightStatusCheck();
scheduleCarStatusCheck();
scheduleHotelRoomStatusCheck();

//======== Routes =========//
app.use('/api/server-status', serverStatusRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/hotels', hotelRouter);
app.use('/api/hotels/:hotelId/rooms', roomRouter);
app.use('/api/hotelBookings', hotelBookingRouter);
app.use('/api/hotel-statistics', hotelStatisticsRouter);
app.use('/api/airlines', airlineRouter);
app.use('/api/planes', planeRouter);
app.use('/api/flights', flightRouter);

app.use('/api/stations', stationRouter);
app.use('/api/trains', trainRouter);
app.use('/api/routes', routeRouter);
app.use('/api/train-trips', trainTripRouter);
app.use('/api/train-trip-bookings', trainTripBookingRouter);

app.use('/api/data', citiesRouter);
app.use('/api/flightTickets', flightTicketRouter);

app.use('/api/cars', publicCarRoute);
app.use('/api/offices/:officeId/cars', officeCarRoute);
app.use('/api/offices', carRentalOfficeRoute);
app.use('/api/cars', carBookingRoute);

app.use('/api/user-fcm-tokens', userFcmTokenRouter);
app.use('/api/mynotifications', myNotificationRouter);

//======== Setup the server ========//
const port = process.env.PORT;
app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});

app.use(globalErrorHandler); //Error Handler
