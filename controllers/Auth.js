const User = require("../models/User");
const bcryptjs=require('bcryptjs');
const jwt = require("jsonwebtoken");
const { set } = require("mongoose");
const nodemailer = require("nodemailer");
//sign up
const signup = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ success: false, message: "please login" });
    }

    const securePassword = await bcryptjs.hash(password, 10);

    const newuser = await User.create({
      name,
      email,
      password: securePassword,
    });

    await newuser.save();

    res.status(200).json({ success: true, message: "user created" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//login
const login = async (req, res) => {
  let { email, password } = req.body;
  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "please sign up first" });
    }

    let checkPassword = await bcryptjs.compare(password, user.password);

    if (!checkPassword) {
      return res
        .status(400)
        .json({ success: false, message: "password incorrect" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      })
      .status(200)
      .json({ success: true, message: "login successfull" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//logout
const logout = async (req, res) => {
  try {
    res.clearCookie("token");

    return res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


const getUser = async (req, res) => {
  const reqId = req.id;
  try {
    let user = await User.findById(reqId).select("-password");
    if (!user) {
      return res.status(400).json({ success: false, message: "please signup" });
    }

    res.status(200).json({user, success: true, message: "user found" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};




module.exports={signup,login,logout,getUser};