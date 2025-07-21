import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const { socket, axios } = useContext(AuthContext);

    // function to get all user forsodeBar
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages)
            }

        } catch (error) {
            console.log("jay shree ram");
            
            toast.error(error.message);

        }
    }

    //function to get messages for the selected User
    const getMessages = async () => {
        try {
            
            const { data } = await axios.get(`/api/messages/${selectedUser._id}`)

            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // function to send message to the selected User
    const sendMessage = async (messageData) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if (data.success) {
                setMessages((prevMessages) => [...prevMessages, data.newMessage])
            }
            else {
                toast.error(data.message);
            }

            

        } catch (error) {
            toast.error(error.message)
        }
    }

    // function to subscribe to messages for selected User
            const subscribeToMessages = async()=>{
                if(!socket)return;

                socket.on("newMessage",(newMessage)=>{
                    if(selectedUser&&newMessage.senderId === selectedUser._id){
                        newMessage.seen = true;
                        setMessages((prevMessages)=>[...prevMessages,newMessage])
                        axios.put(`/api/messages/mark/${newMessage._id}`)
                    }
                    else{
                        setUnseenMessages((prevUnseenMessages)=>({
                          ...prevUnseenMessages,[newMessage.senderId]: prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId]+1:1
                        }))
                    }

                })
            }


            //function const unsubscribeFromMessages
const unsubscribeFromMessages = ()=>{
    if(socket)socket.off("newMessage");
}

useEffect(()=>{
subscribeToMessages();
return ()=> unsubscribeFromMessages();
},[socket,selectedUser])



    const value = {
        messages,users,selectedUser,getUsers,getMessages,sendMessage
        , setSelectedUser,unseenMessages,setUnseenMessages,

    }

    return (<ChatContext.Provider value={value}>
        {children}
    </ChatContext.Provider>
    )
}