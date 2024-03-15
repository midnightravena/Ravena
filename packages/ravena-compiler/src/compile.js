import parse from "ravena-compiler/src/parse";
import generate from "ravena-compiler/src/generate";
import { format } from "ravena-compiler/src/util";
import { error } from "util/index";

/**
 * Compiles a JavaScript file with Ravena syntax.
 *
 * @param {string} input
 * @returns {string} file code
 */
export default function compile(input) {
	const parseOutput = parse(input);

	if (process.env.RAVENA_ENV === "development" && parseOutput.constructor.name === "ParseError") {
		error(`किं करोषि परथ - पार्सरं प्रति अमान्यनिवेशः ।

निवेशस्य विश्लेषणं कर्तुं प्रयत्नः कृतः ।

अपेक्षित ${parseOutput.expected}.

प्राप्तः:

${format(input, parseOutput.index)}`);
	}

	return generate(parseOutput[0][0]);
}
