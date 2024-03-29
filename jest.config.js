module.exports = {
	collectCoverage: true,
	collectCoverageFrom: ["packages/ravena*/src/**/*.js"],
	coverageDirectory: "coverage",
	modulePaths: ["<rootDir>/packages", "<rootDir>/node_modules"],
	transform: {
		"^.*\\.js$": "<rootDir>/build/test/transform.js"
	}
};
