const { modelNames } = require('mongoose');
const asyncHandler = require('../middlewares/asyncHandler');
const GlobalErrorHandler = require('../utils/apiError');
const ApiFeatures = require('../utils/apiFeatures');


exports.DeleteOne= (Model)=>
    asyncHandler(async(req,res,next)=>{
        const {id} = req.params;
        const Doc = await Model.findById(id);
        if(!Doc)
                return next(new GlobalErrorHandler("Doc not found",404));
        await Doc.deleteOne();
        res.status(200).json({status:"SUCCESS",msg:"deleted"});
    });

exports.UpdateOne= (Model)=>
    asyncHandler(async(req,res,next)=>{
        let modelName = Model.modelName;
        modelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
        const newDoc = await Model.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});
        if(!newDoc)
                return next(new GlobalErrorHandler(`${modelName} not found`,404));
        newDoc.save();
        res.status(200).json({status:"SUCCESS",data:{[modelName]: newDoc}});
    });

exports.CreateOne= (Model)=>
    asyncHandler(async(req,res,next)=>{
        const newDoc = new Model(req.body)
        await newDoc.save();
        let modelName = Model.modelName;
        modelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
        res.status(201).json({status:"SUCCESS",data:{[modelName]: newDoc}})
    });

exports.GetOne= (Model,populationOps)=>
    asyncHandler(async(req,res,next)=>{
        const {id} = req.params;
        let query = Model.findById(id);

        let modelName = Model.modelName;
        modelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
        
        if(populationOps) query=query.populate(populationOps);
        const Doc = await query;
        if(!Doc)
                return next(new GlobalErrorHandler(`${modelName} not found`,404));
        res.status(200).json({status:"SUCCESS",data:{[modelName]: Doc}});
    });

exports.GetAll = (Model, _modelName, populateOptions) =>
  asyncHandler(async (req, res, next) => {
    let filterObj = {};
    if (req.filteration) {
      filterObj = req.filteration;
    }

    const countDocs = await Model.countDocuments();
    let query = Model.find(filterObj);

    if (populateOptions) {
      query = query.populate(populateOptions);
    }

    const apiFeatures = new ApiFeatures(query, req.query)
      .search(_modelName)
      .filter()
      .sort()
      .limitFields()
      .paginate(countDocs)
      .buildQuery();

    const { paginateResult, mongooseQuery } = apiFeatures;
    const Docs = await mongooseQuery;

    let modelName = Model.modelName;
    modelName = modelName.charAt(0).toLowerCase() + modelName.slice(1) + 's';

    if (!Docs || Docs.length === 0) {
      return next(new GlobalErrorHandler(`There is no ${modelName} yet`, 404));
    }

    res.status(200).json({
      status: "SUCCESS",
      result: paginateResult,
      data: {
        [modelName]: Docs,
      },
    });
});


