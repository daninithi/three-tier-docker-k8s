// The shape of a task as it is stored in MongoDB.

import mongoose from "mongoose";

export const TITLE_MAX_LENGTH = 200;

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: TITLE_MAX_LENGTH,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    versionKey: false, // hides the internal "__v" field
    toJSON: {
      // Send "id" to clients instead of MongoDB's "_id".
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
