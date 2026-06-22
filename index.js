require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { v4: uuid } = require("uuid");

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

        const type = req.body.type;

        if (!type) {
            return res.status(400).json({
                message: "Upload type is required",
            });
        }

        let key;

        switch (type) {

            case "profile": {

                const userId = req.body.userId;

                if (!userId) {
                    return res.status(400).json({
                        message: "UserId is required for profile uploads",
                    });
                }

                key = `UserProfilePics/${userId}.jpg`;
                break;
            }

            case "foundItem": {

                key = `FoundItems/${uuid()}.jpg`;
                break;
            }

            case "chat": {

                const chatRoomId = req.body.chatRoomId;

                if (!chatRoomId) {
                    return res.status(400).json({
                        message: "chatRoomId is required for chat uploads",
                    });
                }

                key = `ChatImages/${chatRoomId}/${uuid()}.jpg`;
                break;
            }

            default:
                return res.status(400).json({
                    message: "Invalid upload type",
                });
        }

        await s3.send(
            new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            })
        );

        return res.status(200).json({
            url: `${process.env.R2_PUBLIC_URL}/${key}`,
        });

    } catch (e) {

        console.error(e);

        return res.status(500).json({
            message: e.message,
        });

    }
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});