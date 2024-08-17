import { generateToenAndSetCookie } from "../lib/utils/generateToken.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long." });
    }

    // hashing the password
    const salt = await bcrypt.genSalt(10);
    const hashedpassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedpassword,
    });

    if (newUser) {
      generateToenAndSetCookie(newUser._id, res);
      await newUser.save();

      return res.status(201).json({
        _id: newUser._id,
        name: newUser.username,
        email: newUser.email,
        about: newUser.about,
        profileImg: newUser.profileImg,
      });
    } else {
      return res.status(400).json({ error: "Invalid user data." });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    const isPasswordCorrect =
      user && (await bcrypt.compare(password, user.password));

    if (!user || !isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid username or password." });
    }

    generateToenAndSetCookie(user._id, res);

    res.status(200).json({
      _id: user._id,
      name: user.username,
      email: user.email,
      about: user.about,
      profileImg: user.profileImg,
    });
  } catch (error) {
    console.log("Error in Login controller", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.log("Error in Logout controller", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    return res.status(200).json(user);
  } catch (error) {
    console.log("Error in get Me controller", error.message);
    return res.status(500).json({ error: "Internal server error." });
  }
};
