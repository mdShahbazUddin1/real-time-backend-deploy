const mongoose =require("mongoose")

const blackSchema = mongoose.Schema({
    token:{type:String}
})


const BlackListModel = mongoose.model("blacklisttoken",blackSchema)

module.exports = {BlackListModel}