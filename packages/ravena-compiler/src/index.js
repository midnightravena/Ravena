import parse from "ravena-compiler/src/parse";
import generate from "ravena-compiler/src/generate";
import compile from "ravena-compiler/src/compile";

export default {
	compile,
	generate,
	parse,
	version: process.env.RAVENA_VERSION
};
