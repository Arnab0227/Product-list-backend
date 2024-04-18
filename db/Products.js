const mongoose = require('mongoose')

let ProductSchema = new mongoose.Schema({
    name: String,
    price: Number,
    category: String,
    userId: String,
    brand: String

})

module.exports = mongoose.model("products", ProductSchema)