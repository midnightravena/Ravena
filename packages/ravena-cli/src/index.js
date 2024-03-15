import { pad } from "util/index";

const fs = require("fs");
const path = require("path");
const https = require("https");
const exec = require("child_process").exec;

const parameterRE = /<\w+>/g;
const optionRE = /(?:^|\s)(?:\[\w+\]|--?\w+)/g;

const help = {
	version: {
		usage: "ravena version",
		description: "output Ravena CLI version"
	},
	help: {
		usage: "ravena help <command>",
		description: "output help message for command",
		parameters: {
			"<command>": "name of Ravena CLI command"
		}
	},
	create: {
		usage: "ravena create <name> [options]",
		description: "create application in new directory",
		parameters: {
			"<name>": "name of application and directory"
		},
		options: {
			"-t, --template <username>/<repository>": "GitHub repository to use as template"
		}
	}
};

function log(type, message) {
	console.log(`\x1b[34m${type}\x1b[0m ${message}`);
}

function logHelp(message) {
	console.log(highlight(message));
}

function logError(message) {
	console.log(`\x1b[31merror\x1b[0m ${message}`);
}

function highlight(string) {
	return string.replace(parameterRE, "\x1b[33m$&\x1b[0m").replace(optionRE, "\x1b[36m$&\x1b[0m");
}

function table(object) {
	let output = "";
	let separator = "";
	let keyLengthMax = 0;

	for (const key in object) {
		const keyLength = key.length;

		/* istanbul ignore next */
		if (keyLength > keyLengthMax) {
			keyLengthMax = keyLength;
		}
	}

	for (const key in object) {
		const value = object[key];
		output += `${separator}\t${key}${pad(value, keyLengthMax - key.length + value.length + 3)}`;
		separator = "\n";
	}

	return output;
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

function download(name, repo) {
	const archive = {
		method: "GET",
		host: "api.github.com",
		path: `/repos/${repo}/tarball/master`,
		headers: {
			"User-Agent": "Ravena"
		}
	};

	https.get(archive, archiveRes => {
		if (archiveRes.statusCode === 302) {
			https.get(archiveRes.headers.location, downloadRes => {
				if (downloadRes.statusCode === 200) {
					const archivePath = path.join(__dirname, "ravena-template.tar.gz");
					const stream = fs.createWriteStream(archivePath);

					downloadRes.on("data", chunk => {
						stream.write(chunk);
					});

					downloadRes.on("end", () => {
						stream.end();

						log("downloaded", repo);
						install(name, archivePath);
					});
				} else {
					logError(`अमान्य डाउनलोड HTTP प्रतिक्रिया।

टेम्पलेट् डाउनलोड् कर्तुं प्रयत्नः कृतः
	${archiveRes.headers.location}

प्राप्तः त्रुटिः HTTP स्थितिसङ्केतः
	${downloadRes.statusCode}

अपेक्षितः ठीकः HTTP स्थितिसङ्केतः 200 ।`);
				}
			}).on("error", error => {
				logError(`HTTP अनुरोधं डाउनलोड् कर्तुं असफलम्।

टेम्पलेट् डाउनलोड् कर्तुं प्रयत्नः कृतः
	${archiveRes.headers.location}

प्राप्तदोषः
	${error}

अपेक्षितः सफलः HTTP अनुरोधः |`);
			});
		} else {
			logError(`अमान्य संग्रहलिङ्क HTTP प्रतिक्रिया।

टेम्पलेट् कृते संग्रहलिङ्कं आनेतुं प्रयत्नः कृतः
	https://${archive.host}${archive.path}

प्राप्तः त्रुटिः HTTP स्थितिसङ्केतः
	${archiveRes.statusCode}

अपेक्षितं HTTP स्थितिसङ्केतः 302 प्राप्तम्।`);
		}
	}).on("error", error => {
		logError(`संग्रहणलिङ्क HTTP अनुरोधः विफलः।

टेम्पलेट् कृते संग्रहलिङ्कं आनेतुं प्रयत्नः कृतः
	https://${archive.host}${archive.path}

प्राप्तदोषः
	${error}

अपेक्षितः सफलः HTTP अनुरोधः।`);
	});
}

function install(name, archivePath) {
	const targetPath = path.join(process.cwd(), name);

	exec(`mkdir ${targetPath}`, error => {
		if (error !== null) {
			logError(`निर्देशिकानिर्माणं विफलम् ।

निर्देशिकां निर्मातुं प्रयत्नः कृतः
	${targetPath}

प्राप्तदोषः
	${error}

अपेक्षितं सफलं निर्देशिकानिर्माणम्।`);
		}

		exec(`tar -xzf ${archivePath} -C ${targetPath} --strip=1`, error => {
			if (error !== null) {
				logError(`अभिलेखनिष्कासनं विफलम्।

लक्ष्यं प्रति संग्रहं निष्कासयितुं प्रयत्नः कृतः
	${archivePath} -> ${targetPath}

प्राप्तदोषः
	${error}

अपेक्षितं सफलं अभिलेखनिष्कासनम्।`);
			}

			log("installed", targetPath);
			clean(name, archivePath, targetPath);
		});
	});
}

function clean(name, archivePath, targetPath) {
	fs.unlink(archivePath, error => {
		if (error !== null) {
			logError(`संग्रहविलोपनं विफलम्।

संग्रहं विलोपयितुं प्रयत्नः कृतः
	${archivePath}

प्राप्तदोषः
	${error}

अपेक्षितं सफलं संग्रहविलोपनम्।`);
		}

		log("cleaned", archivePath);
		processDirectory(name, targetPath, targetPath);
		log("created", `application \x1b[36m${name}\x1b[0m

आरम्भार्थं चालयन्तु :
	cd ${name}
	npm install
	npm run dev`);
	});
}

function processDirectory(name, directoryPath, targetPath) {
	const files = fs.readdirSync(directoryPath);

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const filePath = path.join(directoryPath, file);

		if (fs.statSync(filePath).isDirectory()) {
			processDirectory(name, filePath, targetPath);
		} else {
			fs.writeFileSync(filePath, replace(fs.readFileSync(filePath), "{# RavenaName #}", name));
			log("processed", path.relative(targetPath, filePath));
		}
	}
}

const argv = process.argv.length === 2 ? ["help"] : process.argv.slice(2);
const commandName = argv[0];
const commandArguments = [];
const commandOptions = {};

for (let i = 1; i < argv.length; i++) {
	const commandArgument = argv[i];

	if (commandArgument[0] === "-") {
		for (; i < argv.length; i++) {
			const commandOption = argv[i];

			if (commandOption[0] === "-") {
				commandOptions[commandOption] = true;
			} else {
				commandOptions[argv[i - 1]] = commandOption;
			}
		}
	} else {
		commandArguments.push(commandArgument);
	}
}

switch (commandName) {
	case "version": {
		logHelp(`Ravena CLI v${process.env.RAVENA_VERSION}`);

		break;
	}

	case "help": {
		const commandNameHelp = commandArguments[0];

		if (commandNameHelp in help) {
			const helpCommand = help[commandNameHelp];

			logHelp(`Usage: ${helpCommand.usage}
	${helpCommand.description}`);

			if ("parameters" in helpCommand) {
				logHelp(`
Parameters:
${table(helpCommand.parameters)}`);
			}

			if ("options" in helpCommand) {
				logHelp(`
Options:
${table(helpCommand.options)}`);
			}
		} else {
			const tableUsageDescription = {};

			for (const command in help) {
				const helpCommand = help[command];
				tableUsageDescription[helpCommand.usage] = helpCommand.description;
			}

			logHelp(`प्रयोगः ravena <command> [options]

आदेशाः
${table(tableUsageDescription)}`);
		}

		break;
	}

	case "create": {
		const name = commandArguments[0];
		const repo = commandOptions["-t"] || commandOptions["--template"] || "midnightravena/ravena-template";

		if (name === undefined || name.length === 0) {
			logError(`असिद्धं वा अज्ञातं वा नाम।

अनुप्रयोगं निर्मातुं प्रयत्नः कृतः।

असिद्धं वा अज्ञातं वा नाम प्राप्तम्।

वैधं नाम अपेक्षितम्। धावनं करोतु \x1b[35mravena help create\x1b[0m to see usage information.`);
		}

		if (repo === true) {
			logError(`अमान्य अथवा अज्ञात टेम्पलेट।

अनुप्रयोगं निर्मातुं प्रयत्नः कृतः।

अमान्यं अज्ञातं वा टेम्पलेट् प्राप्तम् ।

वैध टेम्पलेट् अपेक्षितम्। धावनं करोतु \x1b[35mravena help create\x1b[0m to see usage information.`);
		}

		log("Ravena", "creating application");
		download(name, repo);

		break;
	}

	default: {
		logError(`अप्रसिद्धादेशः ।

आदेशं निष्पादयितुं प्रयत्नः कृतः ।

न विद्यमानः आदेशः प्राप्तः
	${commandName}

वैधः आदेशः अपेक्षितः । धावनं करोतु \x1b[35mravena help\x1b[0m to see valid commands.`);
	}
}
