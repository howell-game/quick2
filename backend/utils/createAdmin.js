const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

async function createInitialAdmin() {
  try {

    const existingAdmin = await Admin.findOne({
      where: {
        username: "admin",
      },
    });

    if (existingAdmin) {
        console.log("✅ Admin already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      "admin",
      12
    );

    await Admin.create({
      username: "admin",
      password: hashedPassword,
      isActive: true,
    });

    console.log("✅ Initial admin account created.");

  } catch (error) {

    console.error(
      "❌ Failed to create initial admin:",
      error
    );

  }
}

module.exports = createInitialAdmin;