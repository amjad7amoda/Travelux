/* ====== Imports ======= */
const mongoose = require('mongoose');
const env = require('dotenv');

/* ====== Config ======= */
env.config()
const database = process.env.DB;

/* ====== Exports ======= */
module.exports = () => {
    mongoose.connect(database)
    .then(() => {
        console.log('The db connected')
    }).catch((err) => {
        console.log(err.message)
    })
}