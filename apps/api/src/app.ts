import express, {Express} from 'express';
import globalErrorHandler from "./middleware/globalErrorHandler";
import requestLogger from "./middleware/requestLogger";
import addressRouter from "./routes/address";

const app: Express = express();

app.use(express.json());

app.use(requestLogger);

app.use('/api/v1/address', addressRouter);

app.use(globalErrorHandler);

export default app;
