import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";

export const sendMessage = async (req, res) => {
  try {
    const { content, chatId, messageType, mediaUrl } = req.body;

    if (!chatId) {
      return res
        .status(400)
        .json({ message: "Invalid data. chatId is required." });
    }

    if (!content && !mediaUrl) {
      return res.status(400).json({
        message: "Invalid data. Either content or mediaUrl must be provided.",
      });
    }

    const messageData = {
      sender: req.user._id,
      chat: chatId,
      content: content || "",
      messageType: messageType || (mediaUrl ? "media" : "text"),
      mediaUrl: mediaUrl || null,
    };

    const newMessage = new Message(messageData);
    const savedMessage = await newMessage.save();

    const chat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { messages: savedMessage._id },
        latestMessage: savedMessage._id,
      },
      { new: true }
    )
      .populate("users", "-password")
      .populate("latestMessage");

    const fullMessage = await Message.findById(savedMessage._id)
      .populate("sender", "name profileImg")
      .populate("chat");

    return res.status(200).json(fullMessage);
  } catch (error) {
    console.log(`Error in sendMessage: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

export const allMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({ message: "Chat ID is required." });
    }

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name profilePic email")
      .populate({
        path: "chat",
        populate: {
          path: "users",
          select: "-password",
        },
      });

    return res.status(200).json(messages);
  } catch (error) {
    console.log(`Error in allMessages: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};
