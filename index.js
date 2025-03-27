import app from "./server.js";
import functions from "@google-cloud/functions-framework";

// Регистрируем HTTP-обработчик
functions.http("api", app);
