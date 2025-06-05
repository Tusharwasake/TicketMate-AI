import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      return done(null, user);
    }
    
    // Check if user exists with the same email
    user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });
    
    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      await user.save();
      return done(null, user);
    }
    
    // Create new user
    user = await User.create({
      googleId: profile.id,
      email: profile.emails[0].value.toLowerCase(),
      name: profile.displayName,
      avatar: profile.photos[0]?.value,
      role: 'user',
      skills: []
    });
    
    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));

// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "/api/auth/facebook/callback",
  profileFields: ['id', 'emails', 'name', 'picture.type(large)']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Facebook ID
    let user = await User.findOne({ facebookId: profile.id });
    
    if (user) {
      return done(null, user);
    }
    
    // Check if user exists with the same email
    const email = profile.emails?.[0]?.value;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        // Link Facebook account to existing user
        user.facebookId = profile.id;
        await user.save();
        return done(null, user);
      }
    }
    
    // Create new user
    user = await User.create({
      facebookId: profile.id,
      email: email?.toLowerCase() || `facebook_${profile.id}@placeholder.com`,
      name: `${profile.name.givenName} ${profile.name.familyName}`,
      avatar: profile.photos?.[0]?.value,
      role: 'user',
      skills: []
    });
    
    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));

export default passport;
