const fs = require("fs");
const path = require("path");
const https = require("https");
const child_process = require("child_process");

// Files
const pathTest = path.join(__dirname, "../../../test-ravena-cli");
const pathTestArchive = path.join(__dirname, "../src/ravena-template.tar.gz");
const pathTemplate = path.join(__dirname, "test-ravena-cli-template");
const pathTemplateArchive = path.join(__dirname, "test-ravena-cli-template.tar.gz");
const pathCLI = path.join(__dirname, "../src/index.js");
process.env.RAVENA_VERSION = "test.test.test";

// Mocks
let httpsRequest;
let httpsArchiveLinkStatusCode = 302;
let httpsArchiveLinkError;
let httpsDownloadStatusCode = 200;
let httpsDownloadError;
let child_processMkdirError;
let child_processTarError;
let fsUnlinkError;

https.get = (options, fn) => {
	if (typeof options === "string" && options === "test-location") {
		fn({
			statusCode: httpsDownloadStatusCode,
			on: (event, fn) => {
				if (event === "data") {
					fn(fs.readFileSync(pathTemplateArchive));
				} else if (event === "end") {
					fn();
				}
			}
		});

		return {
			on: (event, fn) => {
				if (httpsDownloadError !== undefined && event === "error") {
					fn(httpsDownloadError);
				}
			}
		};
	} else {
		expect(options).toEqual(httpsRequest);

		fn({
			statusCode: httpsArchiveLinkStatusCode,
			headers: {
				location: "test-location"
			}
		});

		return {
			on: (event, fn) => {
				if (httpsArchiveLinkError !== undefined && event === "error") {
					fn(httpsArchiveLinkError);
				}
			}
		};
	}
};

child_process.exec = (cmd, fn) => {
	child_process.execSync(cmd);

	if (child_processMkdirError !== undefined && cmd.slice(0, 5) === "mkdir") {
		fn(child_processMkdirError);
	} else if (child_processTarError !== undefined && cmd.slice(0, 3) === "tar") {
		fn(child_processTarError);
	} else {
		fn(null);
	}
};

fs.unlink = (file, fn) => {
	fs.unlinkSync(file);

	if (fsUnlinkError === undefined) {
		fn(null);
	} else {
		fn(fsUnlinkError);
	}
};

fs.createWriteStream = file => {
	return {
		write: chunk => fs.writeFileSync(file, chunk),
		end: () => {}
	};
};

// Tests
function RavenaCLI(args, error) {
	console.log = jest.fn();
	process.argv = ["node", pathCLI, ...args];

	if (error === undefined) {
		require(pathCLI);
	} else {
		expect(() => {
			require(pathCLI)
		}).toThrow(error);
	}

	return console.log.mock.calls.map(call => call[0]).join("\n") + "\n";
}

function replace(content, sub, subNewString) {
	const index = content.indexOf(sub);

	if (index === -1) {
		return content;
	} else {
		const left = content.slice(0, index);
		const right = replace(content.slice(index + sub.length), sub, subNewString);
		const subNew = Buffer.from(subNewString);

		return Buffer.concat([left, subNew, right], left.length + subNew.length + right.length);
	}
}

function init() {
	child_process.execSync(`tar -czf ${pathTemplateArchive} -C ${__dirname} test-ravena-cli-template`);
}

function clean(directory) {
	const files = fs.readdirSync(directory);

	for (let i = 0; i < files.length; i++) {
		const file = path.join(directory, files[i]);

		if (fs.statSync(file).isDirectory()) {
			clean(file);
		} else {
			fs.unlinkSync(file);
		}
	}

	fs.rmdirSync(directory);
}

function cleanAll() {
	httpsRequest = undefined;
	httpsArchiveLinkStatusCode = 302;
	httpsArchiveLinkError = undefined;
	httpsDownloadStatusCode = 200;
	httpsDownloadError = undefined;
	child_processMkdirError = undefined;
	child_processTarError = undefined;
	fsUnlinkError = undefined;

	fs.unlinkSync(pathTemplateArchive);

	if (fs.existsSync(pathTest)) {
		clean(pathTest);
	}

	if (fs.existsSync(pathTestArchive)) {
		fs.unlinkSync(pathTestArchive);
	}
}

function verify(received, expected) {
	const receivedFiles = fs.readdirSync(received);
	const expectedFiles = fs.readdirSync(expected);

	expect(receivedFiles).toEqual(expectedFiles);

	for (let i = 0; i < receivedFiles.length; i++) {
		const receivedFile = receivedFiles[i];
		const receivedFilePath = path.join(received, receivedFile);
		const expectedFile = expectedFiles[i];
		const expectedFilePath = path.join(expected, expectedFile);

		expect(receivedFile).toEqual(expectedFile);

		if (fs.statSync(receivedFilePath).isDirectory()) {
			verify(receivedFilePath, expectedFilePath);
		} else {
			expect(fs.readFileSync(receivedFilePath)).toEqual(replace(fs.readFileSync(expectedFilePath), "{# MoonName #}", "test-ravena-cli"));
		}
	}
}

test("displays help by default", () => {
	jest.resetModules();
	expect(RavenaCLI([])).toEqual(`Usage: ravena \x1b[33m<command>\x1b[0m\x1b[36m [options]\x1b[0m

Commands:
	ravena version                   output Ravena CLI version
	ravena help \x1b[33m<command>\x1b[0m            output help message for command
	ravena create \x1b[33m<name>\x1b[0m\x1b[36m [options]\x1b[0m   create application in new directory
`);
});

test("version command", () => {
	jest.resetModules();
	expect(RavenaCLI(["version"])).toEqual(`Ravena CLI vtest.test.test
`);
});

test("help version command", () => {
	jest.resetModules();
	expect(RavenaCLI(["help", "version"])).toEqual(`Usage: ravena version
	output Ravena CLI version
`);
});

test("help help command", () => {
	jest.resetModules();
	expect(RavenaCLI(["help", "help"])).toEqual(`Usage: ravena help \x1b[33m<command>\x1b[0m
	output help message for command

Parameters:
	\x1b[33m<command>\x1b[0m   name of Ravena CLI command
`);
});

test("help create command", () => {
	jest.resetModules();
	expect(RavenaCLI(["help", "create"])).toEqual(`Usage: ravena create \x1b[33m<name>\x1b[0m\x1b[36m [options]\x1b[0m
	create application in new directory

Parameters:
	\x1b[33m<name>\x1b[0m   name of application and directory

Options:
\x1b[36m\t-t\x1b[0m,\x1b[36m --template\x1b[0m \x1b[33m<username>\x1b[0m/\x1b[33m<repository>\x1b[0m   GitHub repository to use as template
`);
});

test("create command", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/midnightravena/Ravena-template/master",
		headers: {
			"User-Agent": "Ravena"
		}
	};

	expect(RavenaCLI(["create", "test-ravena-cli"])).toEqual(`\x1b[34mMoon\x1b[0m creating application
\x1b[34mdownloaded\x1b[0m midnightravena/Ravena-template
\x1b[34minstalled\x1b[0m ${pathTest}
\x1b[34mcleaned\x1b[0m ${pathTestArchive}
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-2.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-1/test-directory-2-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-2/test-directory-2-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-2.txt
\x1b[34mprocessed\x1b[0m test-file-1.txt
\x1b[34mprocessed\x1b[0m test-file-2.txt
\x1b[34mcreated\x1b[0m application \x1b[36mtest-ravena-cli\x1b[0m

आरम्भार्थं धावन्तु:
	cd test-ravena-cli
	npm install
	npm run dev
`);
	verify(pathTest, pathTemplate);
	cleanAll();
});

test("create command with custom template -t", () => {
	init();
	jest.resetModules();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/test-ravena-cli/test-ravena-cli-template/master",
		headers: {
			"User-Agent": "Ravena"
		}
	};

	expect(RavenaCLI(["create", "test-ravena-cli", "-t", "test-ravena-cli/test-ravena-cli-template"])).toEqual(`\x1b[34mMoon\x1b[0m creating application
\x1b[34mdownloaded\x1b[0m test-ravena-cli/test-ravena-cli-template
\x1b[34minstalled\x1b[0m ${pathTest}
\x1b[34mcleaned\x1b[0m ${pathTestArchive}
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-2.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-1/test-directory-2-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-2/test-directory-2-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-2.txt
\x1b[34mprocessed\x1b[0m test-file-1.txt
\x1b[34mprocessed\x1b[0m test-file-2.txt
\x1b[34mcreated\x1b[0m application \x1b[36mtest-ravena-cli\x1b[0m

आरम्भार्थं धावन्तु:
	cd test-ravena-cli
	npm install
	npm run dev
`);
	verify(pathTest, pathTemplate);
	cleanAll();
});

test("create command with custom template --template", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/test-ravena-cli/test-ravena-cli-template/master",
		headers: {
			"User-Agent": "Ravena"
		}
	};

	expect(RavenaCLI(["create", "test-ravena-cli", "--template", "test-ravena-cli/test-ravena-cli-template"])).toEqual(`\x1b[34mMoon\x1b[0m creating application
\x1b[34mdownloaded\x1b[0m test-ravena-cli/test-ravena-cli-template
\x1b[34minstalled\x1b[0m ${pathTest}
\x1b[34mcleaned\x1b[0m ${pathTestArchive}
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-2.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-1/test-directory-2-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-2/test-directory-2-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-2.txt
\x1b[34mprocessed\x1b[0m test-file-1.txt
\x1b[34mprocessed\x1b[0m test-file-2.txt
\x1b[34mcreated\x1b[0m application \x1b[36mtest-ravena-cli\x1b[0m

आरम्भार्थं धावन्तु:
	cd test-ravena-cli
	npm install
	npm run dev
`);
	verify(pathTest, pathTemplate);
	cleanAll();
});

test("error on unknown command", () => {
	jest.resetModules();
	expect(RavenaCLI(["unknown"])).toEqual(`\x1b[31merror\x1b[0m अप्रसिद्धादेशः ।

आदेशं निष्पादयितुं प्रयत्नः कृतः ।

न विद्यमानः आदेशः प्राप्तः
	unknown

वैधः आदेशः अपेक्षितः । धावनं करोतु \x1b[35mravena help\x1b[0m वैध आदेशान् द्रष्टुं ।
`);
});

test("error on invalid create name", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/midnightravena/Ravena-template/master",
		headers: {
			"User-Agent": "Ravena"
		}
	};

	expect(RavenaCLI(["create"], `The "path" argument must be of type string. Received undefined`)).toEqual(`\x1b[31merror\x1b[0m असिद्धं वा अज्ञातं वा नाम।

अनुप्रयोगं निर्मातुं प्रयत्नः कृतः।

असिद्धं वा अज्ञातं वा नाम प्राप्तम्।

वैधं नाम अपेक्षितम्। धावनं करोतु \x1b[35mravena help create\x1b[0m उपयोगसूचना द्रष्टुं ।
\x1b[34mMoon\x1b[0m creating application
\x1b[34mdownloaded\x1b[0m midnightravena/Ravena-template
`);
	cleanAll(pathTest);
});

test("error on invalid create template", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/true/master",
		headers: {
			"User-Agent": "Ravena"
		}
	};

	expect(RavenaCLI(["create", "test-ravena-cli", "-t"])).toEqual(`\x1b[31merror\x1b[0m अमान्य अथवा अज्ञात टेम्पलेट।

अनुप्रयोगं निर्मातुं प्रयत्नः कृतः।

अमान्यं अज्ञातं वा टेम्पलेट् प्राप्तम् ।

वैध टेम्पलेट् अपेक्षितम्। धावनं करोतु \x1b[35mravena help create\x1b[0m उपयोगसूचना द्रष्टुं ।
\x1b[34mMoon\x1b[0m creating application
\x1b[34mdownloaded\x1b[0m true
\x1b[34minstalled\x1b[0m ${pathTest}
\x1b[34mcleaned\x1b[0m ${pathTestArchive}
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-2.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-1/test-directory-2-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-2/test-directory-2-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-2.txt
\x1b[34mprocessed\x1b[0m test-file-1.txt
\x1b[34mprocessed\x1b[0m test-file-2.txt
\x1b[34mcreated\x1b[0m application \x1b[36mtest-ravena-cli\x1b[0m

आरम्भार्थं चालयन्तु :
	cd test-ravena-cli
	npm install
	npm run dev
`);
	cleanAll(pathTest);
});

test("error on error HTTP status code archive link", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/midnightravena/Ravena-template/master",
		headers: {
			"User-Agent": "Ravena"
		}
	};
	httpsArchiveLinkStatusCode = 500;

	expect(RavenaCLI(["create", "test-ravena-cli"])).toEqual(`\x1b[34mMoon\x1b[0m creating application
\x1b[31merror\x1b[0m अमान्य संग्रहलिङ्क HTTP प्रतिक्रिया।

टेम्पलेट् कृते संग्रहलिङ्कं आनेतुं प्रयत्नः कृतः:
	https://api.github.com/repos/midnightravena/Ravena-template/master

प्राप्तः त्रुटिः HTTP स्थितिसङ्केतः:
	500

अपेक्षितं HTTP स्थितिसङ्केतः 302 प्राप्तम्।
`);
	cleanAll(pathTest);
});

test("error on error HTTP status code download", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/midnightravena/Ravena-template/master",
		headers: {
			"User-Agent": "Ravena"
		}
	};
	httpsDownloadStatusCode = 500;

	expect(RavenaCLI(["create", "test-ravena-cli"])).toEqual(`\x1b[34mMoon\x1b[0m creating application
\x1b[31merror\x1b[0m Invalid download HTTP response.

Attempted to download template:
	test-location

Received error HTTP status code:
	500

Expected OK HTTP status code 200.
`);
	cleanAll(pathTest);
});

test("error on HTTP error for archive link", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/midnightravena/Ravena-template/tarball/master",
		headers: {
			"User-Agent": "Moon"
		}
	};
	httpsArchiveLinkError = "error archive link";

	expect(RavenaCLI(["create", "test-ravena-cli"])).toEqual(`\x1b[34mMoon\x1b[0m creating application
\x1b[34mdownloaded\x1b[0m midnightravena/Ravena-template
\x1b[34minstalled\x1b[0m ${pathTest}
\x1b[34mcleaned\x1b[0m ${pathTestArchive}
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-2.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-1/test-directory-2-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-2/test-directory-2-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-2.txt
\x1b[34mprocessed\x1b[0m test-file-1.txt
\x1b[34mprocessed\x1b[0m test-file-2.txt
\x1b[34mcreated\x1b[0m application \x1b[36mtest-ravena-cli\x1b[0m

आरम्भार्थं चालयन्तु :
	cd test-ravena-cli
	npm install
	npm run dev
\x1b[31merror\x1b[0m संग्रहणलिङ्क HTTP अनुरोधः विफलः।

टेम्पलेट् कृते संग्रहलिङ्कं आनेतुं प्रयत्नः कृतः:
	https://api.github.com/repos/midnightravena/Ravena-template/master

प्राप्तदोषः
	error archive link

अपेक्षितः सफलः HTTP अनुरोधः।
`);
	cleanAll(pathTest);
});

test("error on HTTP error for download", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/midnightravena/Ravena-template/master",
		headers: {
			"User-Agent": "Ravena"
		}
	};
	httpsDownloadError = "error download";

	expect(RavenaCLI(["create", "test-ravena-cli"])).toEqual(`\x1b[34mMoon\x1b[0m creating application
\x1b[34mdownloaded\x1b[0m midnightravena/Ravena-template
\x1b[34minstalled\x1b[0m ${pathTest}
\x1b[34mcleaned\x1b[0m ${pathTestArchive}
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-2.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-1/test-directory-2-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-2/test-directory-2-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-2.txt
\x1b[34mprocessed\x1b[0m test-file-1.txt
\x1b[34mprocessed\x1b[0m test-file-2.txt
\x1b[34mcreated\x1b[0m application \x1b[36mtest-ravena-cli\x1b[0m

आरम्भार्थं चालयन्तु :
	cd test-ravena-cli
	npm install
	npm run dev
\x1b[31merror\x1b[0m HTTP अनुरोधं डाउनलोड् कर्तुं असफलम्।

टेम्पलेट् डाउनलोड् कर्तुं प्रयत्नः कृतः
	test-location

प्राप्तदोषः
	error download

अपेक्षितः सफलः HTTP अनुरोधः।
`);
	cleanAll(pathTest);
});

test("error making directory", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/midnightravena/Ravena-template/master",
		headers: {
			"User-Agent": "Moon"
		}
	};
	child_processMkdirError = "error making directory";

	expect(RavenaCLI(["create", "test-ravena-cli"])).toEqual(`\x1b[34mMoon\x1b[0m creating application
\x1b[34mdownloaded\x1b[0m midnightravena/Ravena-template
\x1b[31merror\x1b[0m निर्देशिकानिर्माणं विफलम् ।

निर्देशिकां निर्मातुं प्रयत्नः कृतः
	${pathTest}

प्राप्तदोषः
	error making directory

अपेक्षितं सफलं निर्देशिकानिर्माणम्।
\x1b[34minstalled\x1b[0m ${pathTest}
\x1b[34mcleaned\x1b[0m ${pathTestArchive}
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-2.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-1/test-directory-2-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-2/test-directory-2-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-2.txt
\x1b[34mprocessed\x1b[0m test-file-1.txt
\x1b[34mprocessed\x1b[0m test-file-2.txt
\x1b[34mcreated\x1b[0m application \x1b[36mtest-ravena-cli\x1b[0m

आरम्भार्थं चालयन्तु:
	cd test-ravena-cli
	npm install
	npm run dev
`);
	cleanAll(pathTest);
});

test("error extracting", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/midnightravena/Ravena-template/master",
		headers: {
			"User-Agent": "Ravena"
		}
	};
	child_processTarError = "error extracting";

	expect(RavenaCLI(["create", "test-ravena-cli"])).toEqual(`\x1b[34mMoon\x1b[0m creating application
\x1b[34mdownloaded\x1b[0m midnightravena/Ravena-template
\x1b[31merror\x1b[0m अभिलेखनिष्कासनं विफलम्।

लक्ष्यं प्रति संग्रहं निष्कासयितुं प्रयत्नः कृतः
	${pathTestArchive} -> ${pathTest}

प्राप्तदोषः
	error extracting

अपेक्षितं सफलं अभिलेखनिष्कासनम्।
\x1b[34minstalled\x1b[0m ${pathTest}
\x1b[34mcleaned\x1b[0m ${pathTestArchive}
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-2.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-1/test-directory-2-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-2/test-directory-2-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-2.txt
\x1b[34mprocessed\x1b[0m test-file-1.txt
\x1b[34mprocessed\x1b[0m test-file-2.txt
\x1b[34mcreated\x1b[0m application \x1b[36mtest-ravena-cli\x1b[0m

आरम्भार्थं चालयन्तु :
	cd test-ravena-cli
	npm install
	npm run dev
`);
	cleanAll(pathTest);
});

test("error cleaning", () => {
	jest.resetModules();
	init();

	httpsRequest = {
		method: "GET",
		host: "api.github.com",
		path: "/repos/midnightravena/Ravena-template/tarball/master",
		headers: {
			"User-Agent": "Ravena"
		}
	};
	fsUnlinkError = "error cleaning";

	expect(RavenaCLI(["create", "test-ravena-cli"])).toEqual(`\x1b[34mMoon\x1b[0m creating application
\x1b[34mdownloaded\x1b[0m midnightravena/Ravena-template
\x1b[34minstalled\x1b[0m ${pathTest}
\x1b[31merror\x1b[0m संग्रहविलोपनं विफलम्।

संग्रहं विलोपयितुं प्रयत्नः कृतः
	${pathTestArchive}

प्राप्तदोषः
	error cleaning

अपेक्षितं सफलं संग्रहविलोपनम्।
\x1b[34mcleaned\x1b[0m ${pathTestArchive}
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-1/test-directory-1-file-2.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-1/test-directory-2-directory-1-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-directory-2/test-directory-2-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-1.txt
\x1b[34mprocessed\x1b[0m test-directory-2/test-directory-2-file-2.txt
\x1b[34mprocessed\x1b[0m test-file-1.txt
\x1b[34mprocessed\x1b[0m test-file-2.txt
\x1b[34mcreated\x1b[0m application \x1b[36mtest-ravena-cli\x1b[0m

आरम्भार्थं चालयन्तु :
	cd test-ravena-cli
	npm install
	npm run dev
`);
	cleanAll(pathTest);
});
