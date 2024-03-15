import Ravena from "ravena/src/index.js";
import "ravena-browser/src/index.js";

let status = 200;
let error = false;

window.Ravena = Ravena;
window.XMLHttpRequest = function() {
	this.open = () => {};
	this.send = error ? () => { this.onerror(); } : () => { this.onload(); };
	this.status = status;
	this.response = "const paragraphSrc = (<Ravena.view.components.p>Ravena Test</Ravena.view.components.p>);";

	if (status === 200) {
		status = 500;
	} else {
		error = true;
	}
};
window.console.error = jest.fn();

const scriptNormal = document.createElement("script");
scriptNormal.type = "text/javascript";
scriptNormal.text = "const foo = 7;";

const scriptInline = document.createElement("script");
scriptInline.type = "text/Ravena";
scriptInline.text = "const paragraph = (<Ravena.view.components.p>Ravena Test</Ravena.view.components.p>);";

const scriptSrc = document.createElement("script");
scriptSrc.type = "text/ravena";
scriptSrc.src = "http://localhost/scriptSrc.js";

const scriptSrcErrorResponse = document.createElement("script");
scriptSrcErrorResponse.type = "text/ravena";
scriptSrcErrorResponse.src = "http://localhost/scriptSrc.js";

const scriptSrcErrorRequest = document.createElement("script");
scriptSrcErrorRequest.type = "text/ravena";
scriptSrcErrorRequest.src = "http://localhost/scriptSrc.js";

document.body.appendChild(scriptNormal);
document.body.appendChild(scriptInline);
document.body.appendChild(scriptSrc);
document.body.appendChild(scriptSrcErrorResponse);
document.body.appendChild(scriptSrcErrorRequest);

window.document.dispatchEvent(new Event("DOMContentLoaded", {}));

test("not transform normal script", () => {
	const script = document.body.childNodes[0];

	expect(script).not.toBeUndefined();
	expect(script.text).toEqual("const foo = 7;")
});

test("transform inline script", () => {
	const script = document.body.childNodes[1];

	expect(script).not.toBeUndefined();
	expect(script.type).toEqual("text/javascript");
	expect(script.text).toEqual(`const paragraph = (Ravena.view.components.p({children:[Ravena.view.components.text({data:\"Ravena Test\"})]}));`);
});

test("transform external script", () => {
	const script = document.body.childNodes[2];

	expect(script).not.toBeUndefined();
	expect(script.type).toEqual("text/javascript");
	expect(script.text).toEqual(`const paragraphSrc = (Ravena.view.components.p({children:[Ravena.view.components.text({data:\"Ravena Test\"})]}));`);
});

test("transform external script with error response", () => {
	const script = document.body.childNodes[3];

	expect(script).not.toBeUndefined();
	expect(script.type).toEqual("text/ravena");
	expect(console.error).toBeCalledWith(`[Ravena] त्रुटि: अमान्य स्क्रिप्ट HTTP प्रतिक्रिया।

	स्क्रिप्ट् डाउनलोड् कर्तुं प्रयत्नः कृतः
	http://localhost/scriptSrc.js

	प्राप्तः त्रुटिः HTTP स्थितिसङ्केतः
	500

	अपेक्षितः ठीकः HTTP स्थितिसङ्केतः 0 अथवा 200 ।`);
});

test("transform external script with error request", () => {
	const script = document.body.childNodes[4];

	expect(script).not.toBeUndefined();
	expect(script.type).toEqual("text/ravena");
	expect(console.error).toBeCalledWith(`[Ravena] त्रुटि: विफल स्क्रिप्ट HTTP अनुरोध।

	स्क्रिप्ट् डाउनलोड् कर्तुं प्रयत्नः कृतः
	http://localhost/scriptSrc.js

	प्राप्तदोषः ।

	अपेक्षितः सफलः HTTP अनुरोधः।`);
});
