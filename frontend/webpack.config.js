const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    devServer: {
        liveReload: false,
        port: 3001,
        open: true,
        hot: true,
        compress: true,
        static: {
            directory: __dirname,
        }
    }
};