import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import babel from "rollup-plugin-babel";
import { uglify } from "rollup-plugin-uglify";

export default [
    {
        input: "src/js/jquery.router.js",
        output: {
            file: "dist/js/jquery.router.js",
            format: "umd",
            name: "deparam",
            sourcemap: true
        },
        plugins: [
            resolve({
                customResolveOptions: {
                    moduleDirectory: "node_modules"
                }
            }),
            commonjs(),
            babel({
                exclude: "node_modules/**"
            })
        ]
    },
    {
        input: "src/js/jquery.router.js",
        output: {
            file: "dist/js/jquery.router.min.js",
            format: "umd",
            name: "deparam"
        },
        plugins: [
            resolve({
                customResolveOptions: {
                    moduleDirectory: "node_modules"
                }
            }),
            commonjs(),
            babel({
                exclude: "node_modules/**"
            }),
            uglify()
        ]
    }
]