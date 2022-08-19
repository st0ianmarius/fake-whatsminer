import { envSchema } from 'env-schema';

const schema = {
  type: 'object',
  required: ['CONFIG'],
  properties: {
    CONFIG: {
      type: 'string',
      default: './config.json',
    },
    MINER_MAC: {
      type: 'string',
    },
  },
};

interface Env {
  CONFIG: string;
  MINER_MAC: string;
}

const envConfig = envSchema<Env>({
  schema,
});

export default envConfig;
