const शीर्षिका = /^([^:]+):\s*([^]*?)\s*$/gm;

export default {
	set(request) {
		const अनुरोध = new XMLHttpRequest();

		// प्रतिक्रिया प्रकारानुसार प्रबंधन करें |
		अनुरोध.responseType = "responseType" in request ? request.responseType : "text";

		// लोड घटना का प्रबंधन करें |
		if ("onLoad" in request) {
			अनुरोध.onload = () => {
				const responseHeaders = {};
				const responseHeadersText = अनुरोध.getAllResponseHeaders();
				let responseHeader;

				// आक्षेपं प्रति शीर्षकं विश्लेषणं कुर्वन्तु।
				while ((responseHeader = शीर्षिका.exec(responseHeadersText)) !== null) {
					responseHeaders[responseHeader[1]] = responseHeader[2];
				}

				// लोड इवेण्ट् हैण्डलर चालयन्तु।
				request.onLoad({
					status: अनुरोध.status,
					headers: responseHeaders,
					body: अनुरोध.response
				});
			};
		}

		// त्रुटिघटना सम्पादयतु।
		if ("onError" in request) {
			अनुरोध.onerror = request.onError;
		}

		// दत्तविधिना URL च सह अनुरोधं उद्घाटयन्तु ।
		अनुरोध.open(
			"method" in request ? request.method : "GET",
			request.url
		);

		// अनुरोधशीर्षकाणि सेट् कुर्वन्तु।
		if ("headers" in request) {
			const requestHeaders = request.headers;

			for (const requestHeaders in requestHeaders) {
				अनुरोध.setRequestHeader(requestHeader, requestHeaders[requestHeader]);
			}
		}

		// दत्तशरीरेण सह अनुरोधं प्रेषयतु।
		अनुरोध.send("body" in request ? request.body : null);
	}
};
