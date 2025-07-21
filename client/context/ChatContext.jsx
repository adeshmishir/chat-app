import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [deletedForMe, setDeletedForMe] = useState({}); // NEW

  const { socket, axios } = useContext(AuthContext);

  // function to get all users for sidebar
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // function to get messages for the selected User
  const getMessages = async () => {
    try {
      const { data } = await axios.get(`/api/messages/${selectedUser._id}`);
      if (data.success) {
        setMessages(data.messages);
        setDeletedForMe({}); // NEW: Reset when changing conversation
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // function to send message to the selected User
  const sendMessage = async (messageData) => {
    try {
      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );
      if (data.success) {
        setMessages((prevMessages) => [...prevMessages, data.newMessage]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // subscribe to messages for selected User
  const subscribeToMessages = async () => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        setUnseenMessages((prevUnseenMessages) => ({
          ...prevUnseenMessages,
          [newMessage.senderId]: prevUnseenMessages[newMessage.senderId]
            ? prevUnseenMessages[newMessage.senderId] + 1
            : 1,
        }));
      }
    });

    // For real-time update of edit/delete
    socket.on("messageEdited", ({ _id, text, isEdited }) => {
      setMessages((msgs) =>
        msgs.map((msg) =>
          msg._id === _id ? { ...msg, text, isEdited } : msg
        )
      );
    });
    socket.on("messageDeleted", ({ _id, deleted }) => {
      setMessages((msgs) =>
        msgs.map((msg) =>
          msg._id === _id ? { ...msg, text: "", image: "", deleted } : msg
        )
      );
    });
    socket.on("messagePermanentlyDeleted", ({ _id }) => {
      setMessages((msgs) => msgs.filter((msg) => msg._id !== _id));
    });
  };

  const editMessage = async (messageId, newText) => {
    try {
      const { data } = await axios.put(`/api/messages/edit/${messageId}`, {
        text: newText,
      });
      if (data.success) {
        setMessages((msgs) =>
          msgs.map((msg) =>
            msg._id === messageId
              ? { ...msg, text: newText, isEdited: true }
              : msg
          )
        );
      }
    } catch (err) {
      toast.error("Failed to edit message.");
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const { data } = await axios.delete(`/api/messages/delete/${messageId}`);
      if (data.success) {
        setMessages((msgs) =>
          msgs.map((msg) =>
            msg._id === messageId
              ? { ...msg, text: "", image: "", deleted: true }
              : msg
          )
        );
      }
    } catch (err) {
      toast.error("Failed to delete message.");
    }
  };

  // NEW: client-side "delete for me"
  const deleteForMe = (messageId) => {
    setDeletedForMe((prev) => ({ ...prev, [messageId]: true }));
  };

  // NEW: permanent delete (for deleted messages)
  const permanentlyDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`/api/messages/permanent/${messageId}`);
      setMessages((msgs) => msgs.filter((msg) => msg._id !== messageId));
    } catch (err) {
      toast.error("Failed to permanently delete message.");
    }
  };

  const unsubscribeFromMessages = () => {
    if (socket) {
      socket.off("newMessage");
      socket.off("messageEdited");
      socket.off("messageDeleted");
      socket.off("messagePermanentlyDeleted");
    }
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
    // eslint-disable-next-line
  }, [socket, selectedUser]);

  const value = {
    messages,
    users,
    selectedUser,
    getUsers,
    getMessages,
    sendMessage,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
    editMessage,
    deleteMessage,
    permanentlyDeleteMessage,
    deleteForMe,
    deletedForMe,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
