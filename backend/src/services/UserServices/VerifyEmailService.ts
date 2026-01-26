import AppError from "../../errors/AppError";
import User from "../../models/User";

const VerifyEmailService = async (token: string): Promise<User> => {
    const user = await User.findOne({ where: { verificationToken: token } });

    if (!user) {
        throw new AppError("ERR_INVALID_TOKEN", 400);
    }

    await user.update({
        emailVerified: true,
        verificationToken: null // Consume token
    });

    return user;
};

export default VerifyEmailService;
