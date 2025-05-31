import mongoose from 'mongoose';
import crypto from 'crypto';

export enum TokenType {
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
}

export interface IToken extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  type: TokenType;
  expiresAt: Date;
  createdAt: Date;
  isValid(): boolean;
}

// Add static methods to the interface
export interface ITokenModel extends mongoose.Model<IToken> {
  generatePasswordResetToken(userId: mongoose.Types.ObjectId | string): Promise<string>;
}

const TokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
    index: true, // Add index for faster lookups
  },
  type: {
    type: String,
    enum: Object.values(TokenType),
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true, // Add index for expiration queries
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Check if token is still valid
TokenSchema.methods.isValid = function(): boolean {
  try {
    const now = new Date();
    const isValid = this.expiresAt > now;
    console.log('Token validity check:', {
      token: this.token ? this.token.substring(0, 8) + '...' : 'undefined',
      expiresAt: this.expiresAt,
      currentTime: now,
      isValid: isValid
    });
    return isValid;
  } catch (error) {
    console.error('Error validating token:', error);
    // Default to invalid if there's an error
    return false;
  }
};

// Static method to generate a password reset token
TokenSchema.statics.generatePasswordResetToken = async function(userId: mongoose.Types.ObjectId | string): Promise<string> {
  if (!userId) {
    console.error('No userId provided for token generation');
    throw new Error('User ID is required to generate a token');
  }

  try {
    // Ensure userId is a proper ObjectId
    const userIdObj = userId instanceof mongoose.Types.ObjectId 
      ? userId 
      : new mongoose.Types.ObjectId(userId.toString());
      
    console.log(`Generating password reset token for user: ${userIdObj.toString()}`);
    
    // Delete any existing password reset tokens for this user
    try {
      const deleteResult = await this.deleteMany({
        userId: userIdObj,
        type: TokenType.PASSWORD_RESET,
      });
      console.log(`Deleted ${deleteResult.deletedCount} existing tokens for user ${userIdObj}`);
    } catch (deleteError) {
      console.error('Error deleting existing tokens:', deleteError);
      // Continue with token generation even if deletion fails
    }

    // Generate a new token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Create expiration date (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Save the token
    try {
      const newToken = await this.create({
        userId: userIdObj,
        token,
        type: TokenType.PASSWORD_RESET,
        expiresAt,
      });
      console.log(`New token created successfully:`, {
        id: newToken._id,
        userId: newToken.userId.toString(),
        token: token.substring(0, 8) + '...',
        expiresAt
      });
    } catch (createError) {
      console.error('Error creating new token:', createError);
      throw createError;
    }

    return token;
  } catch (error) {
    console.error('Error generating password reset token:', error);
    throw new Error('Failed to generate password reset token');
  }
};

// Create and export the Token model
const Token = (mongoose.models.Token as ITokenModel) || 
  mongoose.model<IToken, ITokenModel>('Token', TokenSchema);

export default Token; 