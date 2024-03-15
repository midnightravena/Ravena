import compile from "ravena-compiler/src/compile";
import { error } from "util/index";

const scripts = [];

/**
 * Load scripts in the order they appear.
 */
function load() {
	if (scripts.length !== 0) {
		const script = scripts.shift();
		const src = script.src;

		if (src.length === 0) {
			const scriptNew = document.createElement("script");
			scriptNew.type = "text/javascript";
			scriptNew.text = compile(script.text);

			script.parentNode.replaceChild(scriptNew, script);
			load();
		} else {
			const xhr = new XMLHttpRequest();
			xhr.responseType = "text";

			xhr.onload = () => {
				if (xhr.status === 0 || xhr.status === 200) {
					const scriptNew = document.createElement("script");
					scriptNew.type = "text/javascript";
					scriptNew.text = compile(xhr.response);

					script.parentNode.replaceChild(scriptNew, script);
				} else {
					error(`अमान्य स्क्रिप्ट HTTP प्रतिक्रिया।

स्क्रिप्ट् डाउनलोड् कर्तुं प्रयत्नः कृतः
	${src}

प्राप्तः त्रुटिः HTTP स्थितिसङ्केतः
	${xhr.status}

अपेक्षितः ठीकः HTTP स्थितिसङ्केतः 0 अथवा 200 ।`);
				}

				load();
			};

			xhr.onerror = () => {
				error(`विफल स्क्रिप्ट HTTP अनुरोध।

स्क्रिप्ट् डाउनलोड् कर्तुं प्रयतितम्:
	${src}

प्राप्तदोषः ।

अपेक्षितः सफलः HTTP अनुरोधः।`);
				load();
			};

			xhr.open("GET", src, true);
			xhr.send(null);
		}
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const scriptsAll = document.querySelectorAll("script");

	for (let i = 0; i < scriptsAll.length; i++) {
		const script = scriptsAll[i];

		if (script.type === "text/ravena") {
			scripts.push(script);
		}
	}

	load();
});
