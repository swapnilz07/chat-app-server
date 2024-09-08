import User from "../models/user.model.js";

export const getUserProfile = async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email }).select("-password");

    if (!user) return res.status(400).json({ message: "User not found." });

    return res.status(200).json(user);
  } catch (error) {
    console.log("Error in get user profile", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.status(200).json(users);
  } catch (error) {
    console.log("Error in get all users", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const selectUser = async (req, res) => {
  const { name: searchTerm } = req.query; // Get the searchTerm from the query string
  const { _id: currentUserId } = req.user; // Get currentUserId from the authenticated user object

  if (!searchTerm || typeof searchTerm !== "string") {
    return res.status(400).json({ message: "Invalid search term provided." });
  }

  try {
    const users = await User.find({
      $and: [
        {
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { email: { $regex: searchTerm, $options: "i" } },
          ],
        },
        { _id: { $ne: currentUserId } },
      ],
    }).select("-password");

    if (users.length === 0) {
      return res
        .status(404)
        .json({ message: "No users found matching the search criteria." });
    }

    return res.status(200).json(users);
  } catch (error) {
    console.log("Error in selectUser", error.message);
    return res.status(500).json({ error: error.message });
  }
};
