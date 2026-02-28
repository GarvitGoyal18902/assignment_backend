const User = require('../models/user');

async function createUser({ name, role, isActive }) {
    const user = await User.create({
        name,
        role,
        isActive
    });

    return user;
}

async function getUserByRole(role) {
    const user = await User.findOne({ where: { role: role } });

    return user;
}

module.exports = {
    createUser,
    getUserByRole
};
