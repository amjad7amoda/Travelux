const { body , param} = require("express-validator");
const validatorMiddleware = require("../../../middlewares/validatorMiddleware");
const Trip = require("../../../models/trips/tripModel");
const Event = require("../../../models/trips/eventModel");
const Guider = require("../../../models/trips/guiderModel");
const europeanCountries = require("../../../data/europeanCountries.json");


exports.getTripValidator = [
    param('id').isMongoId().withMessage('Invalid trip id'),
    validatorMiddleware
];

exports.createTripValidator = [
    body('title').notEmpty().withMessage('Trip title is required')
    .isLength({min:3,max:50}).withMessage('Trip title must be at least 3 characters and less than 50 characters'),
    
    body('description').notEmpty().withMessage('Trip description is required')
    .isLength({min:10,max:200}).withMessage('Trip description must be at least 10 characters and less than 200 characters'),
   
    body('price').notEmpty().withMessage('Trip price is required')
    .isNumeric().withMessage('Trip price must be a number')
    .isFloat({min:0}).withMessage('Trip price must be greater than 0'),

    body('duration').notEmpty().withMessage('Trip duration is required')
    .isInt({min:1,max:30}).withMessage('Trip duration must be at least 1 day and less than 30 days'),

    body('country').notEmpty().withMessage('Country is required')
    .custom((value) => {
        const countryExists = europeanCountries.countries.find(
            country => country.name.toLowerCase() === value.toLowerCase()
        );
        if (!countryExists) {
            throw new Error('Country must be a valid European country');
        }
        return true;
    }),

    body('city').notEmpty().withMessage('City is required')
    .custom((value, { req }) => {
        const country = req.body.country;
        if (!country) {
            return true; // سيتم فحصه في فحص البلد
        }
        
        const countryData = europeanCountries.countries.find(
            c => c.name.toLowerCase() === country.toLowerCase()
        );
        
        if (!countryData) {
            return true; // سيتم فحصه في فحص البلد
        }
        
        const cityExists = countryData.cities.some(
            city => city.toLowerCase() === value.toLowerCase()
        );
        
        if (!cityExists) {
            throw new Error(`City must be a valid city in ${country}`);
        }
        
        return true;
    }),
    
    body('maxGroupSize').notEmpty().withMessage('Max group size is required')
    .isInt({min:1,max:100}).withMessage('Max group size must be at least 1 and less than 100'),

    body('category').notEmpty().withMessage('Category is required')
    .isIn(['adventure',
        'cultural',
           'nature',
          'family',
           'romantic',
           'hiking',
           'beach',
           'skiing',
           'camping',
           'fishing',
           'sightseeing',
           'food',
           'music',
           'art',
           'history',
           'sports',
            'other']).withMessage('Category must be a valid category'),
    
    // guider id ,
    body('guider').notEmpty().withMessage('Guider is required')
    .isMongoId().withMessage('Guider must be a valid guider id')
    .custom((value) => {
        return Guider.findById(value).then(guider => {
            if (!guider) {
                return Promise.reject('Guider must be a valid guider');
            }
            return true;
        });
    }),

    // events validation
    body('events').notEmpty().withMessage('Events are required')
    .isArray().withMessage('Events must be an array')
    .custom((events) => {
        if (!Array.isArray(events)) {
            return true; // سيتم فحصه في الفحص السابق
        }
        
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            
            // فحص أن event هو object
            if (typeof event !== 'object' || event === null) {
                throw new Error(`Event at index ${i} must be an object`);
            }
            
            // فحص eventId
            if (!event.eventId) {
                throw new Error(`Event at index ${i} must have eventId`);
            }
            
            // فحص أن eventId هو MongoDB ObjectId صحيح
            if (!event.eventId.match(/^[0-9a-fA-F]{24}$/)) {
                throw new Error(`Event at index ${i} must have a valid eventId`);
            }
            
            // فحص أن الevent موجود فعلاً في قاعدة البيانات
            return Event.findById(event.eventId).then(foundEvent => {
                if (!foundEvent) {
                    throw new Error(`Event with id ${event.eventId} at index ${i} does not exist`);
                }
                return true;
            });
        }
        
        return true;
    }),

    // order validation
    body('events.*.order').optional().isInt({min: 1}).withMessage('Event order must be a positive integer'),

    // duration validation
    body('events.*.duration').optional().isNumeric().withMessage('Event duration must be a number'),

    // start time validation
    body('events.*.startTime').optional().isISO8601().withMessage('Event start time must be a valid date'),

    // end time validation
    body('events.*.endTime').optional().isISO8601().withMessage('Event end time must be a valid date')
    .custom((endTime, { req, path }) => {
        const eventIndex = path.match(/events\[(\d+)\]/)?.[1];
        if (eventIndex !== undefined && req.body.events && req.body.events[eventIndex]) {
            const startTime = req.body.events[eventIndex].startTime;
            if (startTime && new Date(endTime) <= new Date(startTime)) {
                throw new Error(`Event end time at index ${eventIndex} must be after start time`);
            }
        }
        return true;
    }),

    
    validatorMiddleware
];

exports.deleteEventFromTripValidator = [
    param('tripId').isMongoId().withMessage('Invalid trip id'),
    param('eventId').isMongoId().withMessage('Invalid event id'),
    validatorMiddleware
];

exports.addEventToTripValidator = [
    param('tripId').isMongoId().withMessage('Invalid trip id')
    .custom((value) => {
        return Trip.findById(value).then(trip => {
            if (!trip) {
                return Promise.reject('Trip must be a valid trip');
            }
            return true;
        });
    }),
    body('eventId').isMongoId().withMessage('Invalid event id')
    .custom((value) => {
        return Event.findById(value).then(event => {
            if (!event) {
                return Promise.reject('Event must be a valid event');
            }
            return true;
        });
    }),
    body('duration').notEmpty().withMessage('Duration is required')
    .isNumeric().withMessage('Duration must be a number')
    .isFloat({min:0}).withMessage('Duration must be greater than 0'),

    body('startTime').notEmpty().withMessage('Start time is required')
    .isISO8601().withMessage('Start time must be a valid date'),
    
    validatorMiddleware
];