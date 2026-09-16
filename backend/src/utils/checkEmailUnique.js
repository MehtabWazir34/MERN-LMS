import { adminModel } from '../models/adminModel.js';
import { instructorModel } from '../models/instructorModel.js';
import { learnerModel } from '../models/learnerModel.js';

/**
 * Each role lives in its own collection, so Mongoose's per-schema
 * `unique: true` on email only stops duplicates WITHIN that collection —
 * nothing stops the same email registering as an admin AND a learner.
 * That's confusing (which account logs in with that email?) and a soft
 * security issue, so registration checks across all three collections.
 */
export const isEmailTaken = async (email) => {
  const [admin, instructor, learner] = await Promise.all([
    adminModel.findOne({ email }),
    instructorModel.findOne({ email }),
    learnerModel.findOne({ email })
  ]);
  return Boolean(admin || instructor || learner);
};
