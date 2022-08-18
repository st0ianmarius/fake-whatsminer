import { envSchema } from 'env-schema';

const schema = {
  type: 'object',
  required: ['CONFIG'],
  properties: {
    CONFIG: {
      type: 'string',
      default: './config.json',
    },
  },
};

interface Env {
  CONFIG: string;
}

const envConfig = envSchema<Env>({
  schema,
});

export default envConfig;
