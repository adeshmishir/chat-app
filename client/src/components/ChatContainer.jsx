// ChatContainer.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { FaEdit, FaTrashAlt, FaUserSlash, FaUserTimes } from "react-icons/fa";

const ChatContainer = () => {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
    editMessage,
    deleteMessage,
    permanentlyDeleteMessage,
  } = useContext(ChatContext);

  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEnd = useRef();
  const [input, setInput] = useState("");
  const [editMsgId, setEditMsgId] = useState(null);
  const [editText, setEditText] = useState("");
  const [showOptionsId, setShowOptionsId] = useState(null);
  const [deletedForMe, setDeletedForMe] = useState({});
  const [showDeleteOptionsId, setShowDeleteOptionsId] = useState(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return null;
    await sendMessage({ text: input.trim() });
    setInput("");
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (selectedUser) getMessages(selectedUser._id);
    setDeletedForMe({});
  }, [selectedUser]);

  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const displayedMessages = messages.filter((msg) => !deletedForMe[msg._id]);

  return selectedUser ? (
    <div className="h-full overflow-scroll relative backdrop-blur-lg">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img
          src={selectedUser?.profilePic || assets.avatar_icon}
          alt=""
          className="w-8 rounded-full"
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser.fullName}
          {onlineUsers.includes(selectedUser._id) && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
        </p>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden max-w-7"
        />
        <img src={assets.help_icon} alt="" className="max-md:hidden max-w-5" />
      </div>

      {/* Chat Area */}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6">
        {displayedMessages.map((msg, index) => {
          const isSender = msg.senderId === authUser._id;

          return (
            <div
              key={msg._id || index}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if ((isSender && !msg.deleted) || msg.deleted) {
                  setShowOptionsId(msg._id);
                  setShowDeleteOptionsId(null);
                }
              }}
              className={`flex items-end gap-2 justify-end ${
                !isSender && "flex-row-reverse"
              } relative`}
            >
              {msg.deleted ? (
                <p className="italic text-stone-400 bg-transparent relative">
                  Message deleted
                  {isSender && showOptionsId === msg._id && (
                    <div className="absolute top-0 right-0 flex flex-col bg-[#23214c] p-2 rounded shadow text-xs z-10">
                      <button
                        className="text-red-400"
                        onClick={() => {
                          permanentlyDeleteMessage(msg._id);
                          setShowOptionsId(null);
                        }}
                      >
                        <FaTrashAlt className="inline mr-1" /> Delete forever
                      </button>
                    </div>
                  )}
                </p>
              ) : (
                <>
                  {editMsgId === msg._id ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        await editMessage(msg._id, editText);
                        setEditMsgId(null);
                      }}
                      className="flex flex-col gap-1"
                    >
                      <input
                        value={editText}
                        autoFocus
                        onChange={(e) => setEditText(e.target.value)}
                        className="p-2 text-black rounded"
                      />
                      <div className="flex gap-2 mt-1">
                        <button
                          type="submit"
                          className="text-green-500 text-xs"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditMsgId(null)}
                          className="text-gray-400 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : msg.image ? (
                    <img
                      src={msg.image}
                      alt=""
                      className="max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8"
                    />
                  ) : (
                    <p
                      className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${
                        isSender ? "rounded-br-none" : "rounded-bl-none"
                      }`}
                    >
                      {msg.text}
                      {msg.isEdited && (
                        <span className="ml-2 text-xs text-gray-400">
                          (edited)
                        </span>
                      )}
                    </p>
                  )}

                  {/* First Layer: Edit/Delete */}
                  {showOptionsId === msg._id && (
                    <div className="absolute -top-2 right-12 bg-[#23214c] p-2 rounded shadow z-10 flex gap-2 text-white text-sm">
                      {isSender && !msg.deleted && (
                        <>
                          <FaEdit
                            className="cursor-pointer hover:text-blue-400"
                            title="Edit"
                            onClick={() => {
                              setEditMsgId(msg._id);
                              setEditText(msg.text);
                              setShowOptionsId(null);
                            }}
                          />
                          <FaTrashAlt
                            className="cursor-pointer hover:text-red-400"
                            title="Delete"
                            onClick={() => {
                              setShowDeleteOptionsId(msg._id);
                              setShowOptionsId(null);
                            }}
                          />
                        </>
                      )}
                    </div>
                  )}

                  {/* Second Layer: Delete For Me/Everyone */}
                  {showDeleteOptionsId === msg._id && (
                    <div className="absolute top-6 right-12 bg-[#23214c] p-2 rounded shadow z-10 flex gap-4 text-white text-xs">
                      <FaUserSlash
                        title="Delete for me"
                        className="cursor-pointer hover:text-gray-400"
                        onClick={() => {
                          setDeletedForMe((prev) => ({
                            ...prev,
                            [msg._id]: true,
                          }));
                          setShowDeleteOptionsId(null);
                        }}
                      />
                      {isSender && (
                        <FaUserTimes
                          title="Delete for everyone"
                          className="cursor-pointer hover:text-red-400"
                          onClick={() => {
                            deleteMessage(msg._id);
                            setShowDeleteOptionsId(null);
                          }}
                        />
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="text-center text-xs relative">
                <img
                  src={
                    isSender
                      ? authUser?.profilePic || assets.avatar_icon
                      : selectedUser?.profilePic || assets.avatar_icon
                  }
                  alt=""
                  className="w-7 rounded-full"
                />
                <p className="text-gray-500">
                  {formatMessageTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 z-10 bg-transparent">
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full relative">
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(e)}
            type="text"
            placeholder="Send a message"
            className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400"
          />
          <input
            onChange={handleSendImage}
            type="file"
            id="image"
            accept="image/png,image/jpeg"
            hidden
          />
          <label htmlFor="image">
            <img
              src={assets.gallery_icon}
              alt=""
              className="w-5 mr-2 cursor-pointer"
            />
          </label>
        </div>
        <img
          onClick={handleSendMessage}
          src={assets.send_button}
          alt=""
          className="w-7 cursor-pointer"
        />
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
      <img src={assets.logo_icon} alt="" className="max-w-16" />
      <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
    </div>
  );
};

export default ChatContainer;
