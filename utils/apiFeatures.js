class ApiFeatures {
    constructor(mongooseQuery, queryStr) {
        this.mongooseQuery = mongooseQuery;
        this.queryStr = queryStr;
        this.filterQuery = {};
    }

    filter() {
        const filter = { ...this.queryStr };
        const excludeFields = ['page', 'limit', 'sort', 'fields', 'keyWord'];
        excludeFields.forEach(field => delete filter[field]);

        let queryStr = JSON.stringify(filter);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        this.filterQuery = { ...this.filterQuery, ...JSON.parse(queryStr) };
        return this;
    }

    search(Model) {
        if (this.queryStr.keyWord) {
            const keyword = this.queryStr.keyWord;
            if(Model==='ProductModel'){
                const searchQuery = {
                    $or: [
                        { title: { $regex: keyword, $options: 'i' } },
                        { description: { $regex: keyword, $options: 'i' } }
                    ]
                };
                this.filterQuery = { ...this.filterQuery, ...searchQuery };
            }
            else{
                const searchQuery = {
                    $or: [
                        { name: { $regex: keyword, $options: 'i' } }
                    ]
                };
                this.filterQuery = { ...this.filterQuery, ...searchQuery };
            }

        }
        return this;
    }

    sort() {
        if (this.queryStr.sort) {
            const sortBy = this.queryStr.sort.split(',').join(' ');
            this.mongooseQuery = this.mongooseQuery.sort(sortBy);
        }
        return this;
    }

    limitFields() {
        if (this.queryStr.fields) {
            const fields = this.queryStr.fields.split(',').join(' ');
            this.mongooseQuery = this.mongooseQuery.select(fields);
        }
        return this;
    }

    paginate(countDocs) {
        const limit = +this.queryStr.limit || 50;
        const page = +this.queryStr.page || 1;
        const skip = limit * (page - 1);
        const endIndex = page*limit;

        //pagination result
        const pagination={};
        pagination.currentPage= page;
        pagination.limit = limit;
        pagination.numOfPages = Math.ceil(countDocs/limit);
        pagination.hasPreviousPage = page > 1; 
        pagination.hasNextPage = page * limit < countDocs;
        
        if(endIndex < countDocs){
            pagination.next = page+1;
        }

        if(skip >0){
            pagination.prev = page-1;
        }

        this.paginateResult = pagination;
        this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
        return this;
    }

    buildQuery() {
        this.mongooseQuery = this.mongooseQuery.find(this.filterQuery);
        return this;
    }
}

module.exports=ApiFeatures;