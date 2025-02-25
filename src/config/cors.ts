import { CorsOptions } from "cors";
export const corsConfig: CorsOptions = {
  origin: function (origi, handler) {
    const whiteList = [process.env.FRONTEND_URL];

    if (process.argv[2] === "--api") {
      whiteList.push(undefined);
    }
    if (whiteList.includes(origi)) {
      handler(null, true);
    } else {
      handler(new Error("Not allowed by CORS"));
    }
  },
};
