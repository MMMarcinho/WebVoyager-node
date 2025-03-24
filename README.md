This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

run the development server:

### Install
```bash
npm install
```

Due to the usage of Puppeteer, sometimes the installation may takes a long time, wait for a moment.

### LLM
Create a .env.local in the root, it contains:
```plain text
NEXT_PUBLIC_LLM_API_KEY = YOU_API_KEY (like sk-xxxxxxxx)
NEXT_PUBLIC_LLM_API_URL = YOU_API_URL (like https://dashscope.aliyuncs.com/compatible-mode/v1)
NEXT_PUBLIC_LLM_MODEL = YOU_MODEL (like qwen-vl-max)
```

```bash
npm run dev
```

Open [http://localhost:3000/operator](http://localhost:3000/operator) with your browser to see the Easy Operator.
