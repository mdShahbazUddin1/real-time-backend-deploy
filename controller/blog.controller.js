const { BlogModel } = require("../models/Blog");
const uuid = require("uuid");
require("dotenv").config()
const { UserModel } = require("../models/Users");
const { NotificationModel } = require("../models/Notification");
const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.AWSACCESSKEYID,
  secretAccessKey: process.env.AWSSECRETKEY,
  region: process.env.AWSREGION,
});

const s3 = new AWS.S3();

const getAuthorById = async (req, res) => {
  try {
    const authorId = req.userId;

    const isAuthorPresent = await UserModel.findOne({ _id: authorId });

    if (!isAuthorPresent)
      return res.status(403).send({ msg: "Author not found" });

    res.status(200).send(isAuthorPresent);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const getAllBlog = async (req, res) => {
  try {
    const blogs = await BlogModel.find({draft:false}).populate("author");

    if (!blogs || blogs.length === 0) {
      return res.status(404).json({ message: "No published blogs found." });
    }

    res.status(200).send(blogs);
  } catch (error) {
    res.status(500).send(error);
  }
};

const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await BlogModel.findById(id).populate("author");

    if (!blog) {
      return res.status(400).send({ msg: "Blog not found" });
    }

    // Increment the total_reads in the author's account_info
    const authorId = blog.author;
    const author = await UserModel.findById(authorId);
    if (author) {
      author.account_info.total_reads += 1;
      await author.save();
    }

    // Increment the reads count for the blog
    blog.reads += 1;
    await blog.save();

    res.status(200).send(blog);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the blogs." });
  }
};

const getAuthorBlog = async (req, res) => {
  try {
    const authorId = req.userId;

    const blog = await BlogModel.find({
      author: authorId,
      draft: false,
    }).populate("author");

    const author = await UserModel.findById(authorId).select(
      "personal_info.profile_img"
    );

    if (!blog || blog.length === 0) {
      // If no blogs are found, return an empty array for blogs and author details
      return res.status(200).send({ blogs: [], author });
    }

    res.status(200).send(blog);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const createBlog = async (req, res) => {
    
  try {
    const authorId = req.userId;
    const { title, des, content, tags } = req.body;

    let imageS3URL = null;
    if (req.file) {
      const imageBuffer = req.file.buffer;
      const params = {
        Bucket: "blog-website-s3",
        Key: `images/${uuid.v4()}-${req.file.originalname}`,
        Body: imageBuffer,
        ContentType: req.file.mimetype,
      };

      const uploadedImage = await s3.upload(params).promise();
      imageS3URL = uploadedImage.Location;
    }

    const uniqueBlogId = uuid.v4();

    const newBlog = await BlogModel.create({
      blog_id: uniqueBlogId,
      title,
      banner: imageS3URL,
      des,
      content,
      tags,
      author: authorId,
    });

    await newBlog.save();

    const author = await UserModel.findById(authorId);
    if (author) {
      author.account_info.total_posts += 1;
      await author.save();
    }

    res.status(200).send({ msg: "Blog created" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: error.message });
  }
};

const saveToDraft = async (req, res) => {
  try {
    const userId = req.userId;
    const { title, des, content, tags } = req.body;

    // Ensure that required fields are provided in the request
    if (!title || !content) {
      return res
        .status(400)
        .send({ msg: "Missing required fields in the request" });
    }

    let imageS3URL = null;
    if (req.file) {
      const imageBuffer = req.file.buffer;
      const params = {
        Bucket: "blog-website-s3",
        Key: `images/${uuid.v4()}-${req.file.originalname}`,
        Body: imageBuffer,
        ContentType: req.file.mimetype,
      };

      const uploadedImage = await s3.upload(params).promise();
      imageS3URL = uploadedImage.Location;
    }

    const uniqueBlogId = uuid.v4();

    const newBlog = await BlogModel.create({
      blog_id: uniqueBlogId,
      title: title,
      banner: imageS3URL,
      des: des,
      content: content,
      tags: tags,
      author: userId,
      draft: true,
    });

    const newDraftBlog = await newBlog.save();
    res.status(200).send({ msg: "Draft created", newDraftBlog });
  } catch (error) {
    res.status(500).send({ msg: error.message });
  }
};


const getDraftBlog = async (req, res) => {
  try {
    const userId = req.userId;

    const draftBlog = await BlogModel.find({ author: userId, draft: true });

    if (!draftBlog) return res.status(201).send({ msg: "No blog found" });
    res.status(200).json(draftBlog);
  } catch (error) {
    res.status(500).send({ msg: error.message });
  }
};

const getDraftBlogById = async (req, res) => {
  try {
    const userId = req.userId;
    const blogId = req.params.blogId; // Make sure "blogId" matches the parameter name in your route

    // Find the draft blog by its ID
    const draftBlog = await BlogModel.findOne({
      _id: blogId,
      author: userId,
      draft: true,
    }).populate("author");

    if (!draftBlog) {
      return res.status(404).json({ message: "Draft blog not found." });
    }

    res.status(200).send(draftBlog);
  } catch (error) {
    res.status(500).send(error);
  }
};

const updateBlog = async (req, res) => {
  try {
    const { title, desc, content } = req.body;
    const userId = req.user._id;
    const blogId = req.params.blogId;

    const blog = await BlogModel.findById(blogId);

    // Check if the blog exists
    if (!blog) {
      return res.status(404).json({ msg: "Blog not found" });
    }

    // Check if the authenticated user is the author of the blog
    if (blog.author.toString() !== userId) {
      return res
        .status(403)
        .json({ msg: "You are not authorized to update this blog" });
    }
    let imageDataURL = null;
    if (req.file) {
      const imageBuffer = req.file.buffer;
      const imageBase64 = imageBuffer.toString("base64");
      imageDataURL = `data:${req.file.mimetype};base64,${imageBase64}`;
    }

    blog.title = title;
    blog.banner = imageDataURL;
    blog.desc = desc;
    blog.content = content;

    await blog.save();
    const author = await UserModel.findById(authorId);
    if (author) {
      author.account_info.total_posts += 1;
      await author.save();
    }
    res.status(200).send({ msg: "blog update" });
  } catch (error) {
    res.status(500).send({ msg: error.message });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const blog = await BlogModel.findOneAndDelete({
      _id: id,
      author: userId,
    });

    if (!blog)
      return res.status(404).json({
        msg: "Blog not found or you are not authorized to delete this blog",
      });

    await BlogModel.deleteOne({ _id: id, author: userId });

    // Update the user's total_posts in the account_info field (decrement by 1)
    const author = await UserModel.findById(userId);
    if (author) {
      author.account_info.total_posts -= 1;
      await author.save();
    }
    // await updateCacheOnLike(BlogModel)
    res.status(200).json({ msg: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Update a draft by blogId with authorization check
const updateDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, des, content, tags } = req.body;
    const authorId = req.userId;

    const existingDraft = await BlogModel.findOne({
      _id: id,
      author: authorId,
      draft: true,
    });

    if (!existingDraft) {
      return res.status(404).send({ msg: "Draft not found" });
    }

    // Use ternary operators to update the draft's fields
    existingDraft.title = title ? title : existingDraft.title;
    existingDraft.des = des ? des : existingDraft.des;
    existingDraft.content = content ? content : existingDraft.content;
    existingDraft.tags = tags ? tags : existingDraft.tags;
    existingDraft.draft = false;

    await existingDraft.save();
    const author = await UserModel.findById(authorId);
    if (author) {
      author.account_info.total_posts += 1; // Increment by 1 for publishing a draft
      await author.save();
    }

    res.status(200).send({ msg: "Draft updated and published" });
  } catch (error) {
    res.status(500).send({ msg: error.message });
  }
};

const editProfile = async (req, res) => {
  try {
    const {
      username,
      bio,
      youtube,
      instagram,
      facebook,
      twitter,
      github,
      website,
    } = req.body;
    const authorId = req.userId;
    let imageDataURL = null;
    if (req.file) {
      const imageBuffer = req.file.buffer;
      const imageBase64 = imageBuffer.toString("base64");
      imageDataURL = `data:${req.file.mimetype};base64,${imageBase64}`;
    }

    const updateProfile = await UserModel.findOne({ _id: authorId });

    if (!updateProfile) return res.status(403).send({ msg: "Authornot found" });

    updateProfile.personal_info.username = username;
    updateProfile.personal_info.bio = bio;
    updateProfile.personal_info.profile_img = imageDataURL; // Set the profile image here
    updateProfile.social_links.youtube = youtube;
    updateProfile.social_links.instagram = instagram;
    updateProfile.social_links.facebook = facebook;
    updateProfile.social_links.twitter = twitter;
    updateProfile.social_links.github = github;
    updateProfile.social_links.website = website;
    await updateProfile.save();
    res.status(200).send({ msg: "profile updated", updateProfile });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const searchBlogUser = async (req, res) => {
  const { query } = req.query;
  try {
    const blogs = await BlogModel.find({
      title: { $regex: new RegExp(query, "i") },
    }).populate("author");

    res.status(200).send(blogs);
  } catch (error) {
    res.status(500).json({ error:error.message});
  }
};

module.exports = {
  getAuthorById,
  getAllBlog,
  getBlogById,
  getAuthorBlog,
  createBlog,
  saveToDraft,
  getDraftBlog,
  getDraftBlogById,
  updateBlog,
  deleteBlog,
  updateDraft,
  editProfile,
  searchBlogUser
};
