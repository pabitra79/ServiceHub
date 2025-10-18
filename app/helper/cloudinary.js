const cloudinary = require("cloudinary");
const fs = require("fs");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImageToCloudinary = async (file) => {
  if (!file) {
    console.log("No file provided");
    return null;
  }

  try {
    console.log("Uploading file to Cloudinary:", file.path);

    const result = await cloudinary.uploader.upload(file.path, {
      folder: "service_management/users",
      resource_type: "auto",
      transformation: [
        { width: 500, height: 500, crop: "limit" },
        { quality: "auto" },
      ],
    });

    console.log("Upload successful:", result.secure_url);

    // Delete local file after upload
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
      console.log("Local file deleted:", file.path);
    }

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    // Clean up local file even if upload fails
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    throw new Error("Image upload failed: " + error.message);
  }
};

module.exports = uploadImageToCloudinary;
