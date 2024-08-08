import { defineConfig } from 'rollup'
import ts from 'rollup-plugin-ts'

const external = [
    '@koa/router',
    'koa',
    'decorator-helper',
    'reflect-metadata',
    'koa-compose',
    'tslib',
]

export default defineConfig([
    {
        external,
        input: './src/index.ts',
        output: [
            {
                file: './dist/index-esm.mjs',
                format: 'esm',
            },
            {
                file: './dist/index.js',
                format: 'commonjs',
            },
        ],
        plugins: [ts()],
    },
])
