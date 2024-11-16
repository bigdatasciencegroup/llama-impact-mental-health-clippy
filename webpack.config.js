const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: {
        background: './src/background.ts',
        content: './src/content.ts',
        options: './src/options.ts',
        popup: './src/popup.ts'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: "public",
                    to: ".",
                    globOptions: {
                        ignore: ["**/.DS_Store", "**/Thumbs.db"],
                    },
                },
            ],
        }),
    ],
    devtool: 'source-map',  // Helps with debugging
};