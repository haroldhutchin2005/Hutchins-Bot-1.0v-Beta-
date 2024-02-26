const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    name: "pin",
    hasPermission: "members",
    Programmer: "Jonell Magallanes",
    info: "Search images from Pinterest",
    prefix: "disable",
    category: "Media",
    usages: "[query] [count]",
    cooldowns: 10,

    letStart: async function ({ api, event, target }) {
        const query = encodeURIComponent(target.join(' '));
        const count = target[target.length - 1];

        if (!query || isNaN(count)) return api.sendMessage("📝 | Invalid command usage. Example: pin wallpaper 10", event.threadID, event.messageID);

        const imagesDirectory = path.join(__dirname, 'images');

        try {
            await fs.mkdir(imagesDirectory, { recursive: true });

            api.sendMessage("🔍 | Searching Pinterest images. Please wait...", event.threadID, event.messageID);

            const apiUrl = `https://jonellccapis-dbe67c18fbcf.herokuapp.com/api/pin?title=${query}&count=${count}`;
            const response = await axios.get(apiUrl);
            const { count: imageCount, data: imageUrls } = response.data;

            api.sendMessage(`📷 | Found ${imageCount} images. Downloading...`, event.threadID, event.messageID);

            const imageAttachments = [];

            for (let i = 0; i < imageUrls.length; i++) {
                const imageUrl = imageUrls[i];
                const imageBuffer = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                const imageName = `image${i + 1}.jpg`;

                await fs.writeFile(path.join(imagesDirectory, imageName), Buffer.from(imageBuffer.data));

                const imageReadStream = require('fs').createReadStream(path.join(imagesDirectory, imageName));
                imageAttachments.push(imageReadStream);
            }

            for (let i = 0; i < imageAttachments.length; i++) {
                api.sendMessage({ body: '', attachment: imageAttachments[i] }, event.threadID);
            }

            for (let i = 0; i < imageUrls.length; i++) {
                const imageName = `image${i + 1}.jpg`;
                await fs.unlink(path.join(imagesDirectory, imageName));
            }
        } catch (error) {
            console.error("🚧 | Error during processing:", error);
            api.sendMessage("🔨 | An error occurred while processing your request.", event.threadID);
        }
    }
};
