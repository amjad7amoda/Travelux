module.exports = (asyncFn) => (req,res,next)=>{
        asyncFn(req,res,next).catch((err)=>{
            next(err);})
}