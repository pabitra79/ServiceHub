const mongoose = require("mongoose");
const Dbconnection = async () => {
  try {
    const db = await mongoose.connect(process.env.MONGODB_URL);
    if (db) {
      console.log("database is connected");
    }
  } catch (err) {
    console.log("database is not connected");
  }
};
module.exports = Dbconnection;
