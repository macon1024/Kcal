const { users, logs } = require('./db');

const wipeData = async () => {
  try {
    console.log('Wiping users and logs...');
    
    // Remove all users
    await users.remove({}, { multi: true });
    console.log('All users deleted.');

    // Remove all logs
    await logs.remove({}, { multi: true });
    console.log('All daily logs deleted.');

    console.log('Database cleaned successfully (Foods kept intact).');
  } catch (err) {
    console.error('Error wiping database:', err);
  }
};

wipeData();
