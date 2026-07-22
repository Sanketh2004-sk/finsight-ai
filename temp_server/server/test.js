require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
    try {
        console.log("Node:", process.version);
        console.log("URI:", process.env.MONGODB_URI);

        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log("✅ Connected:", conn.connection.host);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();