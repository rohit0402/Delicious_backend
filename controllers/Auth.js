const User = require("../models/User");
const bcrypt = require("bcrypt");
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

    const securePassword = await bcrypt.hash(password, 10);

    const newuser = await User.create({
      name,
      email,
      password: securePassword,
    });

    await newuser.save();

    res.status(201).json({ success: true, message: "user created" });
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

    let checkPassword = await bcrypt.compare(password, user.password);

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
    return res
      .clearCookie("token")
      .json({ success: true, message: "logged out" });
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

    res.status(200).json({ success: true, message: "user found" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//resetPassword;

const resetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const generatedOtp = Math.floor(Math.random() * 10000);

    let user = User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "please sign up " });
    }

    var transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "93e9133d5cbc82",
        pass: "145e0ba70f9df2",
      },
    });

    const info = await transporter.sendMail({
      from: "rohit123sonar@gmail.com", // sender address
      to: email, // list of receivers
      subject: "OTP Generated", // Subject line
      html: `<h3>your generated OTP <i>${generatedOtp}<i/> </h3>`, // html body
    });

    if (info) {
      await User.findOne(
        { email },
        {
          $set: {
            otp: generatedOtp,
          },
        }
      );
    }

    res
      .status(200)
      .json({ success: true, message: "otp has been sent to email" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//verify otp and update
const verifyOTP = async (req, res) => {

  const { newPassword, otp } = req.body;

  try {
    const securePassword = await bcrypt.hash(newPassword, 10);
    let user = User.findOneAndUpdate(
      { otp },
      {
        $set: {
          password: securePassword,
          otp: 0,
        },
      }
    );

    if (!user) {
      return res.status(400).json({ success: false, message: "invalid otp" });
    }

    return res
      .status(200)
      .json({ success: true, message: "new password created" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


module.exports={signup,login,logout,getUser,resetPassword,verifyOTP};