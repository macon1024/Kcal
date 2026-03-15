const { users } = require('./db');

const email = process.argv[2];

if (!email) {
  console.log('Please provide an email address. Usage: node verify-user.js user@example.com');
  process.exit(1);
}

const verifyUser = async () => {
  try {
    const user = await users.findOne({ email });
    
    if (!user) {
      console.log(`User with email ${email} not found.`);
      process.exit(1);
    }

    if (user.isVerified) {
      console.log(`User ${email} is already verified.`);
      process.exit(0);
    }

    await users.update(
      { _id: user._id },
      { $set: { isVerified: true, verificationToken: null } }
    );

    console.log(`Successfully verified user: ${email}`);
    console.log('You can now log in with this account.');

  } catch (err) {
    console.error('Error verifying user:', err);
  }
};

verifyUser();
