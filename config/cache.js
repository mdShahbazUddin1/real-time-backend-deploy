// // cache.js

// const NodeCache = require("node-cache");
// const nodeCache = new NodeCache(); // Cache expiration time in seconds (e.g., 1 hour)

// const updateCacheOnLike = async (BlogModel) => {
//   try {
//     const updatedBlogs = await BlogModel.aggregate([
//       {
//         $match: { draft: false },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "author",
//           foreignField: "_id",
//           as: "author",
//         },
//       },
//     ]);
//     console.log("Updated blogs:", updatedBlogs);

//     nodeCache.set("blogs", updatedBlogs);

//     console.log("Cache updated successfully.");
//   } catch (error) {
//     console.error("Error updating cache on like:", error);
//   }
// };

// module.exports = { nodeCache, updateCacheOnLike };
