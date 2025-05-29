import {LoggerFactory} from "@address-parser/core";

const logger = LoggerFactory.create({ app: 'api', component: 'server' });

import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info("API server started", { port: PORT });
});
