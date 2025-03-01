//pettition solvers
import User from "../models/User"; //User is where the documents of users are store
import type { Request, Response } from "express";
import { checkPassword, hashPassword } from "../utils/auth";
import slugify from "slugify";
import formidable from "formidable";
import { generateJWT } from "../utils/jwt";
import cloudinary from "../config/cloudinary";
import { v4 as uuid } from "uuid";

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

export const getUser = async (req: Request, res: Response) => {
  res.json(req.user);
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { description } = req.body;
    const handle = slugify(req.body.handle, "");
    const handleExists = await User.findOne({ handle });
    if (handleExists && handleExists.email !== req.user.email) {
      res.status(409).json({ error: "Username already exists" });
      return;
    }
    //update user
    req.user.description = description;
    req.user.handle = handle;
    await req.user.save();
    res.send("user profile updated");
  } catch (e) {
    const error = new Error("There was an error");
    res.status(500).json({ error: error.message });
    return;
  }
};

export const uploadImage = async (req: Request, res: Response) => {
  const form = formidable({
    multiples: false,
  });

  try {
    form.parse(req, (error, fields, files) => {
      cloudinary.uploader.upload(
        files.file[0].filepath,
        { public_id: uuid() },
        async (error, result) => {
          if (error) {
            const error = new Error("Error uploading the image");
            res.status(500).json({ error: error });
            return;
          }
          if (result) {
            req.user.image = result.secure_url;
            await req.user.save();
            res.status(200).json({ image: result.secure_url });
          }
        }
      );
    });
  } catch (e) {
    const error = new Error("Error uploading the image");
    res.status(500).json({ error: error });
    return;
  }
};
