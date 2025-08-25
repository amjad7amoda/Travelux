const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const Event = require('../../models/trips/eventModel');
const Trip = require('../../models/trips/tripModel');
const asyncHandler = require('../../middlewares/asyncHandler');
const factory = require('../handlersFactory');
const ApiError = require('../../utils/apiError');
const { uploadSingleImage } = require('../../middlewares/uploadImageMiddleware');
const { createNotificationForMany } = require('../notificationService');

// 1-)trip cover upload
exports.uploadTripImages = uploadSingleImage('tripCover');

//2-)image proccecing before save the image 
exports.resizeTripImages = asyncHandler(async (req, res, next) => {

    if (req.file) {
        const imageFileName = `trip-${uuidv4()}-${Date.now()}-cover.jpeg`;
        await sharp(req.file.buffer)
            .resize(2000, 2000)
            .toFormat('jpeg')
            .jpeg({ quality: 100 })
            .toFile(`uploads/trips/${imageFileName}`);

        req.body.tripCover = imageFileName;
    }

    next();
});

// 3-)Helper function to delete old trip cover
const deleteOldTripCover = async (coverFileName) => {
    if (coverFileName) {
        // استخراج اسم الملف فقط (بعد آخر /)
        const fileName = coverFileName.split('/').pop();
        
        const coverPath = path.join(__dirname, '..', '..', 'uploads', 'trips', fileName);
        try {
            await fs.unlink(coverPath);
        } catch (error) {
            console.error('Error deleting old trip cover:', error);
        }
    }
};

// middleware to convert events to json
exports.convertEventsToJson = asyncHandler(async(req,res,next)=>{
    if (req.body.events) {
        req.body.events = JSON.parse(req.body.events);
    }
    next();
});

// middleware to calculate duration of trip
exports.calculateTripDuration = asyncHandler(async (req, res, next) => {
    if (req.body.events && Array.isArray(req.body.events) && req.body.events.length > 0) {
        // افتراض أن المصفوفة مرتبة تصاعدياً حسب التاريخ والتسلسل
        // أول حدث في المصفوفة
        const firstEvent = req.body.events[0];
        // آخر حدث في المصفوفة
        const lastEvent = req.body.events[req.body.events.length - 1];
        
        // حساب الفرق بالأيام بين تاريخ بداية أول حدث وتاريخ نهاية آخر حدث
        const firstEventStart = new Date(firstEvent.startTime);
        const lastEventEnd = new Date(lastEvent.endTime);
        
        const timeDifference = lastEventEnd.getTime() - firstEventStart.getTime();
        const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
        
        // إضافة يوم واحد إذا كان الفرق أقل من يوم كامل
        const finalDuration = daysDifference < 1 ? 1 : daysDifference;
        
        // تعيين مدة الرحلة
        req.body.duration = finalDuration;
    }
    else{
        req.body.duration = 0;
    }
    
    next();
});

// middleware to set endtime of each event from starttime and duration
exports.setEndTimeOfEachEvent = asyncHandler(async (req, res, next) => {
    if (req.body.events && Array.isArray(req.body.events) && req.body.events.length > 0) {
        req.body.events.forEach(event => {
            // تحويل startTime إلى Date object إذا كان string
            const startTime = typeof event.startTime === 'string' ? new Date(event.startTime) : event.startTime;
            // duration يمثل الساعات، لذا نضرب في 60 * 60 * 1000 (ساعة واحدة بالميلي ثانية)
            // 60 * 60 * 1000 = 3,600,000 ميلي ثانية (ساعة واحدة)
            event.endTime = new Date(startTime.getTime() + event.duration * 60 * 60 * 1000);
        });
    }
    next();
});

// middleware to sort events by startTime and assign order
exports.sortEventsAndAssignOrder = asyncHandler(async (req, res, next) => {
    if (req.body.events && Array.isArray(req.body.events) && req.body.events.length > 0) {
        // ترتيب الأحداث حسب startTime تصاعدياً (يراعي التاريخ والوقت معاً)
        req.body.events.sort((a, b) => {
            const dateA = typeof a.startTime === 'string' ? new Date(a.startTime) : a.startTime;
            const dateB = typeof b.startTime === 'string' ? new Date(b.startTime) : b.startTime;
            return dateA.getTime() - dateB.getTime();
        });
        
        // تعيين order مناسب لكل event (1, 2, 3, ...)
        req.body.events.forEach((event, index) => {
            event.order = index + 1;
        });
    }
    next();
});

// middleware to check for event time conflicts
exports.checkEventTimeConflicts = asyncHandler(async (req, res, next) => {
    if (req.body.events && Array.isArray(req.body.events) && req.body.events.length > 0) {
        const events = req.body.events;
        
        for (let i = 0; i < events.length - 1; i++) {
            const currentEvent = events[i];
            const nextEvent = events[i + 1];
            
            // تحويل startTime إلى Date object إذا كان string
            const currentStartTime = typeof currentEvent.startTime === 'string' ? new Date(currentEvent.startTime) : currentEvent.startTime;
            const nextStartTime = typeof nextEvent.startTime === 'string' ? new Date(nextEvent.startTime) : nextEvent.startTime;
            
            // حساب وقت انتهاء الحدث الحالي
            const currentEventEnd = new Date(currentStartTime.getTime() + currentEvent.duration * 60 * 60 * 1000);
            
            // التحقق من أن الحدث التالي لا يبدأ قبل انتهاء الحدث الحالي
            if (nextStartTime < currentEventEnd) {
                return next(new ApiError(
                    `Time conflict: Event "${nextEvent.eventId}" starts at ${nextEvent.startTime} before the previous event "${currentEvent.eventId}" ends at ${currentEventEnd}`,
                    400
                ));
            }
        }
    }
    next();
});


//**********services ********** */

// @desc get list of trips
// @route get /api/trips
// @access public [user ,admin]
exports.getTrips = asyncHandler(async(req,res,next)=>{
    const trips = await Trip.aggregate([
        {
            $lookup: {
                from: 'guiders',
                localField: 'guider',
                foreignField: '_id',
                as: 'populatedGuider'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'populatedGuider.user',
                foreignField: '_id',
                as: 'guiderUser'
            }
        },
        {
            $lookup: {
                from: 'tripreviews',
                localField: '_id',
                foreignField: 'trip',
                as: 'reviews'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'reviews.user',
                foreignField: '_id',
                as: 'reviewUsers'
            }
        },
        {
            $addFields: {
                'guider': { 
                    $mergeObjects: [
                        { $arrayElemAt: ['$populatedGuider', 0] },
                        { 
                            user: { $arrayElemAt: ['$guiderUser', 0] }
                        }
                    ]
                },
                'reviews': {
                    $map: {
                        input: '$reviews',
                        as: 'review',
                        in: {
                            $mergeObjects: [
                                '$$review',
                                {
                                    user: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$reviewUsers',
                                                    cond: { $eq: ['$$this._id', '$$review.user'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $project: {
                populatedGuider: 0,
                reviewUsers: 0,
                guiderUser: 0
            }
        }
    ]);
    
    // Now populate events separately
    const populatedTrips = await Trip.populate(trips, [
        { path: 'events.eventId' }
    ]);
    
    // معالجة tripCover لكل رحلة
    populatedTrips.forEach(trip => {
        if(trip.tripCover){
            // إذا كان يحتوي على رابط كامل، استخراج اسم الملف فقط
            if(trip.tripCover.startsWith('http')){
                // استخراج اسم الملف من الرابط
                const fileName = trip.tripCover.split('/').pop();
                trip.tripCover = `${process.env.BASE_URL_ADDED}/trips/${fileName}`;
            } else {
                // إذا كان اسم ملف فقط، إضافة الرابط الكامل
                const tripCoverUrl = `${process.env.BASE_URL_ADDED}/trips/${trip.tripCover}`;
                trip.tripCover = tripCoverUrl;
            }
        }
    });
    
    // filter trips by status 
    // if status is not pending, remove it from the array
    const populatedTripsFiltered = populatedTrips.filter(trip => trip.status === 'pending');
    
    res.status(200).json({data: populatedTripsFiltered});
});

// @desc get specific trip
// @route get /api/trips/:id
// @access public [user ,admin]
exports.getTrip = asyncHandler(async(req,res,next)=>{
    const trip = await Trip.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
        {
            $lookup: {
                from: 'guiders',
                localField: 'guider',
                foreignField: '_id',
                as: 'populatedGuider'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'populatedGuider.user',
                foreignField: '_id',
                as: 'guiderUser'
            }
        },
        {
            $lookup: {
                from: 'tripreviews',
                localField: '_id',
                foreignField: 'trip',
                as: 'reviews'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'reviews.user',
                foreignField: '_id',
                as: 'reviewUsers'
            }
        },
        {
            $addFields: {
                'guider': { 
                    $mergeObjects: [
                        { $arrayElemAt: ['$populatedGuider', 0] },
                        { 
                            user: { $arrayElemAt: ['$guiderUser', 0] }
                        }
                    ]
                },
                'reviews': {
                    $map: {
                        input: '$reviews',
                        as: 'review',
                        in: {
                            $mergeObjects: [
                                '$$review',
                                {
                                    user: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$reviewUsers',
                                                    cond: { $eq: ['$$this._id', '$$review.user'] } 
                                                }
                                            },
                                            0
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $project: {
                populatedGuider: 0,
                reviewUsers: 0,
                guiderUser: 0
            }
        }
    ]);
    
    if (!trip || trip.length === 0) {
        return next(new ApiError(`No trip for this id ${req.params.id}`, 404));
    }
    
    // Now populate events separately
    const populatedTrip = await Trip.populate(trip[0], [
        { path: 'events.eventId' }
    ]);
    
    // معالجة tripCover للرحلة
    if(populatedTrip.tripCover){
        // إذا كان يحتوي على رابط كامل، استخراج اسم الملف فقط
        if(populatedTrip.tripCover.startsWith('http')){
            // استخراج اسم الملف من الرابط
            const fileName = populatedTrip.tripCover.split('/').pop();
            populatedTrip.tripCover = `${process.env.BASE_URL_ADDED}/trips/${fileName}`;
        } else {
            // إذا كان اسم ملف فقط، إضافة الرابط الكامل
            const tripCoverUrl = `${process.env.BASE_URL_ADDED}/trips/${populatedTrip.tripCover}`;
            populatedTrip.tripCover = tripCoverUrl;
        }
    }
    
    res.status(200).json({data: populatedTrip});
});

// @desc create trip
// @route post /api/trips
// @access private [admin]
exports.createTrip = asyncHandler(async(req,res,next)=>{
    const trip = await Trip.create(
        {title:req.body.title,
        description:req.body.description,
        price:req.body.price,
        duration:req.body.duration,
        country:req.body.country,
        city:req.body.city,
        maxGroupSize:req.body.maxGroupSize,
        category:req.body.category,
        guider:req.body.guider,
        events:req.body.events,
        tripCover:req.body.tripCover,
    });

    // معالجة tripCover للرحلة المنشأة
    if(trip.tripCover){
        // إذا كان يحتوي على رابط كامل، استخراج اسم الملف فقط
        if(trip.tripCover.startsWith('http')){
            // استخراج اسم الملف من الرابط
            const fileName = trip.tripCover.split('/').pop();
            trip.tripCover = `${process.env.BASE_URL_ADDED}/trips/${fileName}`;
        } else {
            // إذا كان اسم ملف فقط، إضافة الرابط الكامل
            const tripCoverUrl = `${process.env.BASE_URL_ADDED}/trips/${trip.tripCover}`;
            trip.tripCover = tripCoverUrl;
        }
    }

    res.status(201).json({data:trip});
});

// @desc update trip
// @route put /api/trips/:id
// @access private [admin]
exports.updateTrip = asyncHandler(async(req,res,next)=>{
    const {id} = req.params;
    
    // التحقق من وجود الرحلة
    const trip = await Trip.findById(id);
    if (!trip) {
        return next(new ApiError('Trip not found', 404));
    }

    // تحديد الخانات المسموح بتحديثها فقط
    const allowedFields = ['title', 'description', 'price', 'country', 'city', 'maxGroupSize', 'category', 'guider', 'status', 'tripCover'];
    
    // إنشاء object يحتوي فقط على الخانات المسموح بها
    const updateData = {};
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    });

    // التحقق من maxGroupSize إذا كان يتم تحديثه
    if (updateData.maxGroupSize !== undefined) {
        if (updateData.maxGroupSize < trip.registeredUsers.length) {
            return next(new ApiError(
                `Max group size cannot be less than current registered users count (${trip.registeredUsers.length})`,
                400
            ));
        }
    }

    // التحقق من country و city إذا كان يتم تحديثهما
    if (updateData.country || updateData.city) {
        const countryToCheck = updateData.country || trip.country;
        const cityToCheck = updateData.city || trip.city;
        
        // التحقق من أن البلد موجود في europeanCountries
        const europeanCountries = require('../../data/europeanCountries.json');
        const countryExists = europeanCountries.countries.find(
            country => country.name.toLowerCase() === countryToCheck.toLowerCase()
        );
        
        if (!countryExists) {
            return next(new ApiError('Country must be a valid European country', 400));
        }
        
        // التحقق من أن المدينة تنتمي للبلد
        const cityExists = countryExists.cities.some(
            city => city.toLowerCase() === cityToCheck.toLowerCase()
        );
        
        if (!cityExists) {
            return next(new ApiError(`City must be a valid city in ${countryToCheck}`, 400));
        }
    }

    // التحقق من guider إذا كان يتم تحديثه
    if (updateData.guider) {
        const Guider = require('../../models/trips/guiderModel');
        const guider = await Guider.findById(updateData.guider);
        if (!guider) {
            return next(new ApiError('Guider not found', 404));
        }
    }

    // تحديث الصورة إذا كان هناك ملف جديد
    if (req.file && trip.tripCover) {
        // حذف الصورة القديمة
        await deleteOldTripCover(trip.tripCover);
        // إضافة اسم الصورة الجديدة
        updateData.tripCover = req.body.tripCover;
    }

    // تحديث الرحلة بالبيانات المحددة فقط
    const updatedTrip = await Trip.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    );

    // معالجة tripCover للرحلة المحدثة
    if(updatedTrip.tripCover){
        // إذا كان يحتوي على رابط كامل، استخراج اسم الملف فقط
        if(updatedTrip.tripCover.startsWith('http')){
            // استخراج اسم الملف من الرابط
            const fileName = updatedTrip.tripCover.split('/').pop();
            updatedTrip.tripCover = `${process.env.BASE_URL_ADDED}/trips/${fileName}`;
        } else {
            // إذا كان اسم ملف فقط، إضافة الرابط الكامل
            const tripCoverUrl = `${process.env.BASE_URL_ADDED}/trips/${updatedTrip.tripCover}`;
            updatedTrip.tripCover = tripCoverUrl;
        }
    }

    // إرسال إشعارات لجميع المستخدمين المحجوزين
    let notificationsSent = 0;
    if (trip.registeredUsers && trip.registeredUsers.length > 0) {
        try {
            // استخراج معرفات المستخدمين المحجوزين
            const userIds = trip.registeredUsers.map(user => user.userId.toString());
            
            // رسالة إشعار عامة
            const notificationMessage = `Trip "${trip.title}" has been updated. Please review the new information.`;
            
            // إرسال الإشعارات لجميع المستخدمين المحجوزين
            await createNotificationForMany(
                userIds,
                'Trip Updated',
                notificationMessage,
                'trip'
            );
            
            notificationsSent = userIds.length;
        } catch (notificationError) {
            console.error('Error sending trip update notifications to users:', notificationError);
            // استمر حتى لو فشلت الإشعارات
        }
    }
    
    res.status(200).json({ 
        data: updatedTrip,
        notificationsSent: notificationsSent,
        message: `Trip updated successfully and ${notificationsSent} notifications sent to booked users`
    });
});


// @desc add event to trip by id 
//@route post /api/trips/:tripid/events
//@access private [admin]
exports.addEventToTrip = asyncHandler(async(req,res,next)=>{
    const {tripId} = req.params;
    const {eventId} = req.body;
    
    const trip = await Trip.findById(tripId);
    const event = await Event.findById(eventId);
    
    // check if event is in trip
    if (trip.events.includes(eventId)) {
        return next(new ApiError('Event already in trip', 400));
    }
    
    // copy from events array
    const eventsCopy = [...trip.events];
    
    // تحويل startTime إلى Date object إذا كان string
    const startTime = typeof req.body.startTime === 'string' ? new Date(req.body.startTime) : req.body.startTime;
    
    // new event
    const newEvent = {
        eventId:req.body.eventId,
        order: eventsCopy.length + 1,
        duration: req.body.duration,
        startTime: startTime,
        endTime: new Date(startTime.getTime() + req.body.duration * 60 * 60 * 1000),
    }
    // add new event to eventsCopy
    eventsCopy.push(newEvent);
    
    // reorder eventsCopy array by startTime
    eventsCopy.sort((a,b)=>{
        const dateA = typeof a.startTime === 'string' ? new Date(a.startTime) : a.startTime;
        const dateB = typeof b.startTime === 'string' ? new Date(b.startTime) : b.startTime;
        return dateA.getTime()-dateB.getTime();
    });

    // إعادة تعيين order للأحداث بعد الترتيب
    eventsCopy.forEach((event, index) => {
        event.order = index + 1;
    });

    // check for conflict 
    for (let i = 0; i < eventsCopy.length - 1; i++) {
        const currentEvent = eventsCopy[i];
        const nextEvent = eventsCopy[i + 1];
        
        // تحويل startTime إلى Date object إذا كان string
        const currentStartTime = typeof currentEvent.startTime === 'string' ? new Date(currentEvent.startTime) : currentEvent.startTime;
        const nextStartTime = typeof nextEvent.startTime === 'string' ? new Date(nextEvent.startTime) : nextEvent.startTime;
        
        // حساب وقت انتهاء الحدث الحالي
        const currentEventEnd = new Date(currentStartTime.getTime() + currentEvent.duration * 60 * 60 * 1000);
        
        // التحقق من أن الحدث التالي لا يبدأ قبل انتهاء الحدث الحالي
        if (nextStartTime < currentEventEnd) {
            return next(new ApiError(
                `Time conflict: Event "${nextEvent.eventId}" starts at ${nextEvent.startTime} before the previous event "${currentEvent.eventId}" ends at ${currentEventEnd}`,
                400
            ));
        }
    }

    // calculate new duration
    const firstEvent = eventsCopy[0];
    const lastEvent = eventsCopy[eventsCopy.length - 1];
    
    // حساب الفرق بالأيام بين تاريخ بداية أول حدث وتاريخ نهاية آخر حدث
    const firstEventStart = typeof firstEvent.startTime === 'string' ? new Date(firstEvent.startTime) : firstEvent.startTime;
    const lastEventEnd = typeof lastEvent.endTime === 'string' ? new Date(lastEvent.endTime) : lastEvent.endTime;
    
    const timeDifference = lastEventEnd.getTime() - firstEventStart.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
    
    // إضافة يوم واحد إذا كان الفرق أقل من يوم كامل
    const finalDuration = daysDifference < 1 ? 1 : daysDifference;

    // update trip
    trip.events = eventsCopy;
    trip.duration = finalDuration;
    await trip.save();



    res.status(200).json({data:trip});
});





// @desc delete event from trip by id 
//@route delete /api/trips/:tripid/events/:eventid
//@access private [admin]
exports.deleteEventFromTrip = asyncHandler(async(req,res,next)=>{
    const {tripId,eventId} = req.params;

    // check if trip exists
    const trip = await Trip.findById(tripId);
    if (!trip) {
        return next(new ApiError('Trip not found', 404));
    }

    // check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
        return next(new ApiError('Event not found', 404));
    }

    // check if event is in trip
    const eventInTrip = trip.events.find(e => e.eventId.toString() === eventId);
    if (!eventInTrip) {
        return next(new ApiError('Event not found in trip', 404));
    }

    // get copy from events array 
    let eventsCopy = [...trip.events];

    // delete event from eventsCopy
    eventsCopy = eventsCopy.filter(event => event.eventId.toString() !== eventId);

    // reorder eventsCopy array
    eventsCopy.forEach((event,index)=>{
        event.order = index + 1;
    });

    // calculate new duration
    const firstEvent = eventsCopy[0];

    // آخر حدث في المصفوفة
    const lastEvent = eventsCopy[eventsCopy.length - 1];
    
    // حساب الفرق بالأيام بين تاريخ بداية أول حدث وتاريخ نهاية آخر حدث
    const firstEventStart = typeof firstEvent.startTime === 'string' ? new Date(firstEvent.startTime) : firstEvent.startTime;
    const lastEventEnd = typeof lastEvent.endTime === 'string' ? new Date(lastEvent.endTime) : lastEvent.endTime;
    
    const timeDifference = lastEventEnd.getTime() - firstEventStart.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
    
    // إضافة يوم واحد إذا كان الفرق أقل من يوم كامل
    const finalDuration = daysDifference < 1 ? 1 : daysDifference;

    // update trip
    trip.events = eventsCopy;
    trip.duration = finalDuration;
    await trip.save();


    res.status(200).json({data:trip});
});



