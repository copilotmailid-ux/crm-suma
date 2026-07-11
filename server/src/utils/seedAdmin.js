const Admin = require('../models/Admin');

const seedAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: 'admin@placementcell.com' });

    if (!adminExists) {
      await Admin.create({
        name: 'Super Admin',
        email: 'admin@placementcell.com',
        password: 'Admin@123',
      });
      console.log('Default admin seeded: admin@placementcell.com / Admin@123');
    } else {
      console.log('Admin already exists, skipping seed');
    }
  } catch (error) {
    console.error('Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;
