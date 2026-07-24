const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');

async function main() {
  await sequelize.authenticate();
  await sequelize.sync();
  const email = process.env.PROVISION_ADMIN_EMAIL;
  const password = process.env.PROVISION_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Runtime administrator credentials are required');
  const passwordHash = await bcrypt.hash(password, 10);
  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: { email, name: 'Runtime Administrator', password, role: 'admin' },
  });
  if (!created) {
    await User.update(
      { name: 'Runtime Administrator', password: passwordHash, role: 'admin' },
      { where: { id: user.id }, hooks: false },
    );
  }
  await sequelize.close();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
