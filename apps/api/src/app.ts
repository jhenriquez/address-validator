import express, {Express} from 'express';
import globalErrorHandler from "./middleware/globalErrorHandler";
import requestLogger from "./middleware/requestLogger";

const app: Express = express();

app.use(express.json());

app.use(requestLogger);

// TODO: Include real routes

app.use(globalErrorHandler);

export default app;
