// const express = require("express"); CJS
import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./config/db";
import router from "./router";
import { corsConfig } from "./config/cors";

connectDB();

const app = express();
//cors
app.use(cors(corsConfig)); // habilitamos cors
//express middleware part
app.use(express.json());

app.use(router); // configuramos, es como un setter

export default app; // exportamos ya seteado para usarlo
