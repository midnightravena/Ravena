import view from "ravena/src/view/index";
import route from "ravena/src/route/index";
import raven from "ravena/src/m/index";

export default {
	raven,
	route,
	version: process.env.RAVENA_VERSION,
	view
};
