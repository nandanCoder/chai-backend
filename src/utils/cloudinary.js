import { v2 as cloudinary } from "cloudinary";
import fs from "fs"; // node file systam
//| its help link , unlink , read, path, files

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // uplod file on cloudinary
    const responce = await cloudinary.uploader(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfully
    console.log("file uploaded successfully on cloudinary");
    console.log("file uploaded !!! ", responce);
    return responce;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locallly temorary file as the upload opration got faild
  }
};

export { uploadOnCloudinary };
