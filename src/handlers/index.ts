//pettition solvers
import User from "../models/User"; //User is where the documents of users are store
import type { Request, Response } from "express";
import { checkPassword, hashPassword } from "../utils/auth";
import slugify from "slugify";
import { generateJWT } from "../utils/jwt";

export const createAccount = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    // sanitizing user email
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(409).json({ error: "Email already exists" });
      return;
    }
    // sanitizing user nickname
    const handle = slugify(req.body.handle, "");
    const handleExists = await User.findOne({ handle });
    if (handleExists) {
      res.status(409).json({ error: "Username already exists" });
      return;
    }
    // create user document
    const user = new User(req.body);
    // saving nickname
    user.handle = handle;
    // crypting pass
    user.password = await hashPassword(password);
    // save in db
    await user.save();
    // send answer
    res.status(201).send({ msg: "User created" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    //middleware handler
    const user = await User.findOne({ email });
    //checks if the email exists
    if (!user) {
      const error = new Error("user does not exits");
      res.status(404).json({ error: error.message });
      return;
    }
    //check password
    const isPasswordCorrect = await checkPassword(password, user.password);
    if (!isPasswordCorrect) {
      const error = new Error("Incorrect Password");
      res.status(401).json({ error: error.message });
      return;
    }
    //generate token
    const token = generateJWT({ id: user._id });
    res.json(token);
  } catch (err) {
    res
      .status(404)
      .json({ error: "Internal server error", details: err.message });
  }
};
