import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";

export const sendMessage = async (req, res) => {
  try {
    const {
      content,
      chatId,
      messageType,
      mediaUrl,
      fileName,
      fileSize,
      replyTo,
    } = req.body;

    // Validation
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

    // Default messageType to "text" if not provided
    const determinedMessageType = messageType || (mediaUrl ? "media" : "text");

    // Create a new message object
    const newMessage = new Message({
      sender: req.user._id, // Assuming the user is stored in req.user
      chat: chatId,
      content: content || "", // Default to an empty string if content is not provided
      messageType: determinedMessageType, // Use determined message type
      mediaUrl: mediaUrl || null, // Media URL for images, videos, documents, etc.
      fileName: fileName || null, // Optional: Name of the file
      fileSize: fileSize || null, // Optional: Size of the file
      replyTo: replyTo || null, // For reply functionality
    });

    // Save the message to the database
    const savedMessage = await newMessage.save();

    // Update the latest message in the chat
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { messages: savedMessage._id },
        latestMessage: savedMessage._id,
      },
      { new: true }
    )
      .populate("users", "-password") // Populate users for frontend rendering
      .populate("latestMessage"); // Populate the latest message

    // Populate sender information in the saved message
    const fullMessage = await Message.findById(savedMessage._id)
      .populate("sender", "name profileImg") // Assuming sender's profilePic is needed
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

    // Validate chatId
    if (!chatId) {
      return res.status(400).json({ message: "Chat ID is required." });
    }

    // Fetch all messages for the specified chatId
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name profilePic email") // Populate sender with name and profile picture
      .populate("chat")
      .populate("replyTo") // Optional: Populate replyTo if you want to show the original message
      .populate("reaction.user", "name profileImg"); // Populate user who reacted

    // Return the messages in the response
    return res.status(200).json(messages);
  } catch (error) {
    console.log(`Error in allMessages: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};
