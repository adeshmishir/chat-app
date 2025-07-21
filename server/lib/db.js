import mongoose from "mongoose"

// function to comnnect mongoose database
export const connectDB = async ()=>{
   try {

    mongoose.connection.on('connected',()=>console.log('DB Connected'));
    await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`)

   } catch (error) {
    
     console.log(error);
   }
   
}