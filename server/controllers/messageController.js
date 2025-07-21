import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io,userSocketMap } from "../server.js";




//Get all Users except logged in user
export const getUserForSidebar = async(req,res)=>{
    try {
        const userId = req.user._id;
        const filteredUser = await User.find({_id:{$ne: userId}}).select("-password")

        // count number of messages not seen
        const unseenMessages = {};
        const promises = filteredUser.map(async(user)=>{
            const messages = await Message.find({senderId:user._id,receiverId:userId,seen:false})

            if(messages.length>0){
                unseenMessages[user._id] = messages.length;
            }
        })
        await Promise.all(promises);
        res.json({success:true,users:filteredUser,unseenMessages})

    } catch (error) {
        console.log(error.message);
        
        res.json({success:false,message:error.message});
        
    }
}

// get all messages for selected user
export const getMessages = async(req,res)=>{
    try {
        const {id:selectedUserId} = req.params;
        const myId  = req.user._id;
        const messages = await Message.find({
            $or:[
                {senderId:myId,receiverId:selectedUserId},
                {senderId:selectedUserId,receiverId:myId},
            ]
        })

        await Message.updateMany({senderId:selectedUserId,receiverId:myId},{seen:true});
        res.json({success:true,messages})
    } catch (error) {
         console.log(error.message);
        res.json({success:false,message:error.message});
    }
}

// api to mark message as seen using meessage Id
export const markMessageSeen = async(req,res)=>{
    try {
        const {id }= req.params;
     await Message.findByIdAndUpdate(id,{seen:true});
       res.json({success:true})

    } catch (error) {
         console.log(error.message);
        res.json({success:false,message:error.message});
    }
}

// Send message to selected user
export const sendMessage=async(req,res)=>{
    try {
        const {text,image} = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;

        }
       const newMessage =await Message.create({
        senderId,
        receiverId,
        text,
        image:imageUrl
       })
      
       // emit the new message to the receiver Socket
       const receiverSocketId = userSocketMap[receiverId];
       if(receiverSocketId){
        io.to(receiverSocketId).emit("newMessage",newMessage)
       }

       res.json({success:true,newMessage});

    } catch (error) {
           console.log(error.message);
        res.json({success:false,message:error.message});
    }
}
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });
    if (!message.senderId.equals(userId)) return res.status(403).json({ success: false, message: "Not authorized" });

    message.text = text;
    message.isEdited = true;
    await message.save();

    const receiverSocketId = userSocketMap[message.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", { _id: messageId, text, isEdited: true });
    }

    res.json({ success: true, message: "Message edited", updatedMessage: message });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });
    if (!message.senderId.equals(userId)) return res.status(403).json({ success: false, message: "Not authorized" });

    message.text = "";
    message.image = "";
    message.deleted = true;
    await message.save();

    const receiverSocketId = userSocketMap[message.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", { _id: messageId, deleted: true });
    }

    res.json({ success: true, message: "Message deleted", deletedMessage: message });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
export const permanentlyDeleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });
    if (!message.senderId.equals(userId)) return res.status(403).json({ success: false, message: "Not authorized" });

    await message.deleteOne();

    // Optionally notify receiver that the message was permanently deleted:
    const receiverSocketId = userSocketMap[message.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messagePermanentlyDeleted", { _id: messageId });
    }

    res.json({ success: true, message: "Message permanently deleted" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


