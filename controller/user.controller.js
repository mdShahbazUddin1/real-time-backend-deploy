const bcrypt = require("bcrypt");
const { UserModel } = require("../models/Users");
const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
const { v4: uuidv4 } = require("uuid");
const admin = require("firebase-admin");
const serviceAccountKey = require("../config/blog-management-804c9-firebase-adminsdk-kpo6y-1e497b786f.json");
const { getAuth } = require("firebase-admin/auth");
const jwt = require("jsonwebtoken");
const { BlackListModel } = require("../models/blacklist");
require("dotenv").config();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

const formatData = (user) => {
  const token = jwt.sign({ userId: user._id }, process.env.SECRET_ACCESS_KEY,{expiresIn:"1h"});

  return {
    profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
    fullname: user.personal_info.fullname,
    token,
  };
};

const generateUsername = (email) => {
  let username = email.split("@")[0] + uuidv4().substring(0, 5);
  return username;
};

const register = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    if (fullname.length < 3) {
      return res
        .status(403)
        .json({ msg: "Fullname must be at least 3 letters long" });
    }

    if (!email) {
      return res.status(403).json({ msg: "Enter Email" });
    }

    if (!emailRegex.test(email)) {
      return res.status(403).json({ msg: "Email is invalid" });
    }

    const emailExists = await UserModel.findOne({
      "personal_info.email": email,
    });
    if (emailExists) {
      return res.status(403).json({ msg: "Email is already registered" });
    }

    if (!passwordRegex.test(password)) {
      return res.status(403).json({
        msg: "Password must be 6 letter and contain 1 uppercase letter and 1 number ",
      });
    }

    const hashedPass = await bcrypt.hash(password, 10);
    const username = generateUsername(email);

    const newUser = new UserModel({
      personal_info: {
        fullname,
        email,
        password: hashedPass,
        username,
      },
    });

    await newUser.save();
    return res.status(200).json(formatData(newUser));
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const isUser = await UserModel.findOne({ "personal_info.email": email });

    if (!isUser) {
      return res.status(403).json({ msg: "User not found" });
    }

    const isPassCorrect = await bcrypt.compare(
      password,
      isUser.personal_info.password
    );

    if (!isPassCorrect) {
      return res.status(403).json({ msg: "Wrong credentials" });
    }
    res.status(200).json(formatData(isUser));
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { access_token } = req.body;
    const decodedUser = await getAuth().verifyIdToken(access_token);
    const { email, name, picture } = decodedUser;
    const modifiedPicture = picture.replace("s96-c", "s384-c");

    // Check if the user is already authenticated with a session
    if (req.session.user) {
      const user = req.session.user;

      return res.status(200).json(formatData(user));
    } else {
      // User is not authenticated in the session; check if they exist
      let user = await UserModel.findOne({
        "personal_info.email": email,
      }).exec();

      if (user) {
        // User exists; check if they logged in with Google
        if (!user.google_auth) {
          return res.status(403).json({
            error:
              "This account was signed up without using Google. Please login with email & password.",
          });
        }
      } else {
        const username = await generateUsername(email);
        user = new UserModel({
          personal_info: {
            fullname: name,
            email,
            profile_img: modifiedPicture,
            username,
          },
          google_auth: true,
        });

        try {
          await user.save();
        } catch (err) {
          return res.status(500).json({ error: err.message });
        }
      }

      req.session.user = user;

      return res.status(200).json(formatData(user));
    }
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to log in using Google. Please try again." });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPass, newPass } = req.body;
    const authorId = req.userId; 

    const user = await UserModel.findOne({ _id: authorId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPassword = await bcrypt.compare(
      currentPass,
      user.personal_info.password
    );

    if (!isPassword) {
      return res.status(403).send({ message: "Current password is wrong" });
    }

    const hashedNewPass = await bcrypt.hash(newPass, 10);

    user.personal_info.password = hashedNewPass;

    await user.save(); 

    res.status(200).send({ message: "Password changed" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const logout = async (req, res) => {
  try {
    const token = req.headers?.authorization;
    if (!token) {
      return res.status(400).json({ msg: "Token is invalid or not provided" });
    }

    const blacklistToken = new BlackListModel({
      token: token,
    });

    await blacklistToken.save();

    res.status(200).json({ msg: "Logout success" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  logout,
  changePassword
};
