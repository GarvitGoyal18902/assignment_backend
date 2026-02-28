const User = require('../models/user');
const connectDB = require('../lib/mongodb');

async function createUser({ name, role, isActive }) {
    await connectDB();
    const user = await User.create({
        name,
        role,
        isActive
    });

    return user;
}

async function getUserByRole(role) {
    await connectDB();
    const user = await User.findOne({ role: role });
    return user;
}

module.exports = {
    createUser,
    getUserByRole
};
