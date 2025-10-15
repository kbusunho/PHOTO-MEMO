const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const path = require('path');

const s3 = new S3Client({
  region: 'ap-northeast-2', // 서울 리전
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const fileName = `photos/${Date.now()}_${path.basename(file.originalname)}`;
      cb(null, fileName);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
