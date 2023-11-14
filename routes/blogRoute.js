const express = require("express")
const multer = require("multer");
const blogRoute = express.Router()
const blogController = require("../controller/blog.controller")
const { auth } = require("../middleware/auth")

blogRoute.use(express.json({ limit: "50mb" }));

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // Set the maximum file size to 50MB
  },
});

blogRoute.get("/author",auth,blogController.getAuthorById)
blogRoute.get("/getallblog",auth,blogController.getAllBlog)
blogRoute.get("/getblog/:id",auth,blogController.getBlogById);
blogRoute.post(
  "/createblog",
  auth,
  upload.single("image"),
  blogController.createBlog
);
blogRoute.get("/authorblog",auth,blogController.getAuthorBlog)
blogRoute.post(
  "/savedraft",auth,
  upload.single("image"),
  blogController.saveToDraft
);
blogRoute.get("/getdraft",auth,blogController.getDraftBlog);
blogRoute.get("/draft/:blogId",auth, blogController.getDraftBlogById);
blogRoute.put(
  "/updateblog",
  auth,
  upload.single("image"),
  blogController.updateBlog
);
blogRoute.delete("/deleteblog/:id",auth,blogController.deleteBlog)
blogRoute.put("/update/:id",auth,blogController.updateDraft)
blogRoute.put(
  "/editprofile",
  auth,
  upload.single("image"),
  blogController.editProfile
);
blogRoute.get("/search",auth,blogController.searchBlogUser)





module.exports = {
    blogRoute
}