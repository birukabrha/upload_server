require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");

const {
    S3Client,
    PutObjectCommand,
} = require("@aws-sdk/client-s3");

const app = express();

app.use(cors());

const upload = multer({
    storage: multer.memoryStorage(),
});

const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

app.post("/upload", upload.single("file"), async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded",
            });
        }

        const userId = req.body.userId;

        if (!userId) {
            return res.status(400).json({
                message: "UserId is required",
            });
        }

        const extension = req.file.originalname.split(".").pop();

        const key = `UserProfilePics/${userId}.${extension}`;

        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            })
        );

        return res.json({
            url: `${process.env.R2_PUBLIC_URL}/${key}`,
        });

    } catch (e) {

        console.log(e);

        return res.status(500).json({
            message: e.message,
        });

    }

});

app.listen(process.env.PORT, () => {
    console.log("Server running...");
});

// require("dotenv").config();

// const express = require("express");
// const cors = require("cors");
// const multer = require("multer");
// const { v4: uuid } = require("uuid");

// const {
//     S3Client,
//     PutObjectCommand,
// } = require("@aws-sdk/client-s3");

// const app = express();

// app.use(cors());

// const upload = multer({
//     storage: multer.memoryStorage(),
// });

// const s3 = new S3Client({
//     region: "auto",
//     endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
//     credentials: {
//         accessKeyId: process.env.R2_ACCESS_KEY_ID,
//         secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
//     },
// });

// app.post("/upload", upload.single("file"), async (req, res) => {
//     try {

//         if (!req.file) {
//             return res.status(400).json({
//                 message: "No file uploaded",
//             });
//         }

//         const extension = req.file.originalname.split(".").pop();

//         const filename = `${uuid()}.${extension}`;

//         await s3.send(
//             new PutObjectCommand({
//                 Bucket: process.env.R2_BUCKET_NAME,
//                 Key: filename,
//                 Body: req.file.buffer,
//                 ContentType: req.file.mimetype,
//             })
//         );

//         return res.json({
//             url: `${process.env.R2_PUBLIC_URL}/${filename}`,
//         });

//     } catch (err) {

//         console.log(err);

//         res.status(500).json({
//             message: err.message,
//         });

//     }
// });

// app.listen(process.env.PORT, () => {
//     console.log(`Running on port ${process.env.PORT}`);
// });