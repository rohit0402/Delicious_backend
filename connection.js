const mongoose=require('mongoose');

const connectdDB= async()=>{
    try {
        const connection=await mongoose.connect(process.env.MONGO_URL);
        if(connection){
            console.log("Connected to DB");
        }
    } catch (error) {
        return error.message;
    }
}

module.exports={connectdDB};