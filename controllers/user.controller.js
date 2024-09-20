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

export const updateUser = async (req, res) => {
  const { name, email, about, currentPassword, newPassword } = req.body;
  let { profileImg } = req.body;

  const userId = req.user._id;
  try {
    let user = await User.findOne(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (
      (!newPassword && currentPassword) ||
      (!currentPassword && newPassword)
    ) {
      return res.status(400).json({
        message: "Please provide both current password and new password.",
      });
    }

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch)
        return res
          .status(400)
          .json({ message: "current password is incorrect" });

      if (newPassword.length < 6)
        return res
          .status(400)
          .json({ message: "Password must be atleast 6 characters long." });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (profileImg) {
      if (user.profileImg) {
        await cloudanary.uploader.destroy(
          user.profileImg.split("/").pop().split(".")[0]
        );
      }

      const uploadedResponse = await cloudanary.uploader.upload(profileImg);
      profileImg = uploadedResponse.secure_url;
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.about = about || user.about;
    user.profileImg = profileImg || user.profileImg;

    user = await user.save();

    user.password = null;

    return res.status(200).json({ user });
  } catch (error) {
    console.log("Error in update User", error.message);
    return res.status(500).json({ error: error.message });
  }
};
