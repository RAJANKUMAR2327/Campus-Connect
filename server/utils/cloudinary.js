import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Storage for notes (PDFs + images)
const noteStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'campus-connect/notes',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    resource_type: 'auto',
  },
})

// Storage for marketplace images
const marketplaceStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'campus-connect/marketplace',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    resource_type: 'image',
    transformation: [{ width: 800, crop: 'limit', quality: 'auto' }],
  },
})

export const uploadNote = multer({
  storage: noteStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
})

export const uploadMarketplaceImage = multer({
  storage: marketplaceStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
})

export const deleteFromCloudinary = async (publicId, resourceType = 'raw') => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}

export default cloudinary