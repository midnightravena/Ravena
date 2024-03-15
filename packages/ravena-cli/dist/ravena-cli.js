(function () {
	"use strict";

	/**
	 * HTML tag names
	 */
	/**
	 * Pads a string with spaces on the left to match a certain length.
	 *
	 * @param {string} string
	 * @param {number} length
	 * @returns {string} padded string
	 */

	function pad(string, length) {
		var remaining = length - string.length;

		for (var i = 0; i < remaining; i++) {
			string = " " + string;
		}

		return string;
	}

	var fs = require("fs");

	var path = require("path");

	var https = require("https");

	var exec = require("child_process").exec;

	var parameterRE = /<\w+>/g;
	var optionRE = /(?:^|\s)(?:\[\w+\]|--?\w+)/g;
	var help = {
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
		console.log("\x1B[34m" + type + "\x1B[0m " + message);
	}

	function logHelp(message) {
		console.log(highlight(message));
	}

	function logError(message) {
		console.log("\x1B[31merror\x1B[0m " + message);
	}

	function highlight(string) {
		return string.replace(parameterRE, "\x1b[33m$&\x1b[0m").replace(optionRE, "\x1b[36m$&\x1b[0m");
	}

	function table(object) {
		var output = "";
		var separator = "";
		var keyLengthMax = 0;

		for (var key in object) {
			var keyLength = key.length;
			/* istanbul ignore next */

			if (keyLength > keyLengthMax) {
				keyLengthMax = keyLength;
			}
		}

		for (var _key in object) {
			var value = object[_key];
			output += separator + "\t" + _key + pad(value, keyLengthMax - _key.length + value.length + 3);
			separator = "\n";
		}

		return output;
	}

	function replace(content, sub, subNewString) {
		var index = content.indexOf(sub);

		if (index === -1) {
			return content;
		} else {
			var left = content.slice(0, index);
			var right = replace(content.slice(index + sub.length), sub, subNewString);
			var subNew = Buffer.from(subNewString);
			return Buffer.concat([left, subNew, right], left.length + subNew.length + right.length);
		}
	}

	function download(name, repo) {
		var archive = {
			method: "GET",
			host: "api.github.com",
			path: "/repos/" + repo + "/tarball/master",
			headers: {
				"User-Agent": "Ravena"
			}
		};
		https.get(archive, function (archiveRes) {
			if (archiveRes.statusCode === 302) {
				https.get(archiveRes.headers.location, function (downloadRes) {
					if (downloadRes.statusCode === 200) {
						var archivePath = path.join(__dirname, "ravena-template.tar.gz");
						var stream = fs.createWriteStream(archivePath);
						downloadRes.on("data", function (chunk) {
							stream.write(chunk);
						});
						downloadRes.on("end", function () {
							stream.end();
							log("downloaded", repo);
							install(name, archivePath);
						});
					} else {
						logError("अमान्य डाउनलोड HTTP प्रतिक्रिया।\n\nटेम्पलेट् डाउनलोड् कर्तुं प्रयत्नः कृतः\n\t" + archiveRes.headers.location + "\n\nप्राप्तः त्रुटिः HTTP स्थितिसङ्केतः\n\t" + downloadRes.statusCode + "\n\nअपेक्षितः ठीकः HTTP स्थितिसङ्केतः 200 ।");
					}
				}).on("error", function (error) {
					logError("HTTP अनुरोधं डाउनलोड् कर्तुं असफलम्।\n\nटेम्पलेट् डाउनलोड् कर्तुं प्रयत्नः कृतः\n\t" + archiveRes.headers.location + "\n\nप्राप्तदोषः\n\t" + error + "\n\nअपेक्षितः सफलः HTTP अनुरोधः |");
				});
			} else {
				logError("अमान्य संग्रहलिङ्क HTTP प्रतिक्रिया।\n\nटेम्पलेट् कृते संग्रहलिङ्कं आनेतुं प्रयत्नः कृतः\n\thttps://" + archive.host + archive.path + "\n\nप्राप्तः त्रुटिः HTTP स्थितिसङ्केतः\n\t" + archiveRes.statusCode + "\n\nअपेक्षितं HTTP स्थितिसङ्केतः 302 प्राप्तम्।");
			}
		}).on("error", function (error) {
			logError("संग्रहणलिङ्क HTTP अनुरोधः विफलः।\n\nटेम्पलेट् कृते संग्रहलिङ्कं आनेतुं प्रयत्नः कृतः\n\thttps://" + archive.host + archive.path + "\n\nप्राप्तदोषः\n\t" + error + "\n\nअपेक्षितः सफलः HTTP अनुरोधः।");
		});
	}

	function install(name, archivePath) {
		var targetPath = path.join(process.cwd(), name);
		exec("mkdir " + targetPath, function (error) {
			if (error !== null) {
				logError("निर्देशिकानिर्माणं विफलम् ।\n\nनिर्देशिकां निर्मातुं प्रयत्नः कृतः\n\t" + targetPath + "\n\nप्राप्तदोषः\n\t" + error + "\n\nअपेक्षितं सफलं निर्देशिकानिर्माणम्।");
			}

			exec("tar -xzf " + archivePath + " -C " + targetPath + " --strip=1", function (error) {
				if (error !== null) {
					logError("अभिलेखनिष्कासनं विफलम्।\n\nलक्ष्यं प्रति संग्रहं निष्कासयितुं प्रयत्नः कृतः\n\t" + archivePath + " -> " + targetPath + "\n\nप्राप्तदोषः\n\t" + error + "\n\nअपेक्षितं सफलं अभिलेखनिष्कासनम्।");
				}

				log("installed", targetPath);
				clean(name, archivePath, targetPath);
			});
		});
	}

	function clean(name, archivePath, targetPath) {
		fs.unlink(archivePath, function (error) {
			if (error !== null) {
				logError("संग्रहविलोपनं विफलम्।\n\nसंग्रहं विलोपयितुं प्रयत्नः कृतः\n\t" + archivePath + "\n\nप्राप्तदोषः\n\t" + error + "\n\nअपेक्षितं सफलं संग्रहविलोपनम्।");
			}

			log("cleaned", archivePath);
			processDirectory(name, targetPath, targetPath);
			log("created", "application \x1B[36m" + name + "\x1B[0m\n\nआरम्भार्थं चालयन्तु :\n\tcd " + name + "\n\tnpm install\n\tnpm run dev");
		});
	}

	function processDirectory(name, directoryPath, targetPath) {
		var files = fs.readdirSync(directoryPath);

		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			var filePath = path.join(directoryPath, file);

			if (fs.statSync(filePath).isDirectory()) {
				processDirectory(name, filePath, targetPath);
			} else {
				fs.writeFileSync(filePath, replace(fs.readFileSync(filePath), "{# RavenaName #}", name));
				log("processed", path.relative(targetPath, filePath));
			}
		}
	}

	var argv = process.argv.length === 2 ? ["help"] : process.argv.slice(2);
	var commandName = argv[0];
	var commandArguments = [];
	var commandOptions = {};

	for (var i = 1; i < argv.length; i++) {
		var commandArgument = argv[i];

		if (commandArgument[0] === "-") {
			for (; i < argv.length; i++) {
				var commandOption = argv[i];

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
		case "version":
			{
				logHelp("Ravena CLI v" + "1.0.0");
				break;
			}

		case "help":
			{
				var commandNameHelp = commandArguments[0];

				if (commandNameHelp in help) {
					var helpCommand = help[commandNameHelp];
					logHelp("Usage: " + helpCommand.usage + "\n\t" + helpCommand.description);

					if ("parameters" in helpCommand) {
						logHelp("\nParameters:\n" + table(helpCommand.parameters));
					}

					if ("options" in helpCommand) {
						logHelp("\nOptions:\n" + table(helpCommand.options));
					}
				} else {
					var tableUsageDescription = {};

					for (var command in help) {
						var _helpCommand = help[command];
						tableUsageDescription[_helpCommand.usage] = _helpCommand.description;
					}

					logHelp("Usage: ravena <command> [options]\n\nCommands:\n" + table(tableUsageDescription));
				}

				break;
			}

		case "create":
			{
				var name = commandArguments[0];
				var repo = commandOptions["-t"] || commandOptions["--template"] || "midnightravena/Ravena-template";

				if (name === undefined || name.length === 0) {
					logError("अनुप्रयोगं निर्मातुं प्रयत्नः कृतः।\n\nआदेशं निष्पादयितुं प्रयत्नः कृतः ।\n\nअसिद्धं वा अज्ञातं वा नाम प्राप्तम्।\n\nवैधं नाम अपेक्षितम्। धावनं करोतु \x1B[35mmoon help create\x1B[0m उपयोगसूचना द्रष्टुं ।");
				}

				if (repo === true) {
					logError("अनुप्रयोगं निर्मातुं प्रयत्नः कृतः।\n\nआदेशं निष्पादयितुं प्रयत्नः कृतः ।\n\nअसिद्धं वा अज्ञातं वा नाम प्राप्तम्।\n\nवैधं नाम अपेक्षितम्। धावनं करोतु \x1B[35mmoon help create\x1B[0m उपयोगसूचना द्रष्टुं ।");
				}

				log("Ravena", "creating application");
				download(name, repo);
				break;
			}

		default:
			{
				logError("अप्रसिद्धादेशः ।\n\nआदेशं निष्पादयितुं प्रयत्नः कृतः ।\n\nन विद्यमानः आदेशः प्राप्तः\n\t" + commandName + "\n\nवैधः आदेशः अपेक्षितः । धावनं करोतु \x1B[35mmoon help\x1B[0m वैध आदेशान् द्रष्टुं ।");
			}
	}

}());
