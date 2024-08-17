import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";

export const accessChat = async (req, res) => {
  const userId = req.body.userId || req.query.userId;

  if (!userId) return res.status(400).json({ message: "User ID is required." });

  try {
    // Check if chat already exists
    let isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate("users", "-password")
      .populate("latestMessage");

    isChat = await User.populate(isChat, {
      path: "latestMessage.sender",
      select: "name profileImg email",
    });

    if (isChat.length > 0) {
      return res.status(200).json(isChat[0]);
    } else {
      // Create a new chat if it doesn't exist
      const chatData = {
        chatName: "sender",
        isGroupChat: false,
        users: [req.user._id, userId],
      };

      const createChat = await Chat.create(chatData);

      const fullChat = await Chat.findOne({ _id: createChat._id }).populate(
        "users",
        "-password"
      );

      return res.status(200).json(fullChat);
    }
  } catch (error) {
    console.log(`Error in accessChat: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

export const fetchChats = async (req, res) => {
  try {
    // Find chats where the user is part of the chat
    const chats = await Chat.find({ users: req.user._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "name profileImg email",
        },
      })
      .sort({ updatedAt: -1 });

    // Send the fetched chats as response
    res.status(200).json(chats);
  } catch (error) {
    console.error(`Error in fetchChats: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const createGroupChat = async (req, res) => {
  if (!req.body.users || !req.body.name)
    return res.status(400).json({ message: "Please fill all the details." });

  var users = JSON.parse(req.body.users);

  if (users.length < 2)
    return res
      .status(400)
      .json({ message: "More than 2 users are required to form a group." });

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    console.error(`Error in createGroupChat: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const renameGroup = async (req, res) => {
  const { chatId, chatName } = req.body;

  try {
    const updateChatName = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updateChatName) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json(updateChatName);
  } catch (error) {
    console.error(`Error in renameGroup: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    const added = await Chat.findByIdAndUpdate(
      chatId,
      {
        $push: { users: userId },
      },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!added) return res.status(400).json({ error: "Users not added" });

    res.status(200).json(added);
  } catch (error) {
    console.error(`Error in addToGroup: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;
  try {
    const removed = await Chat.findByIdAndUpdate(
      chatId,
      {
        $pull: { users: userId },
      },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!removed) return res.status(400).json({ error: "Users not added" });

    res.status(200).json(removed);
  } catch (error) {
    console.error(`Error in removeFromGroup: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
