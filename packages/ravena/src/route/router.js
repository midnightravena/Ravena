/**
 * दृश्यानां वर्तमानमार्गस्य च नक्शाङ्कनं कुर्वन्तः मार्गाः दत्ताः दृश्यं प्रत्यागच्छति ।
 *
 * @param {object} input
 * @returns {object} view
 */
export default function router(input) {
	const route = input.route;
	let routeSegment = "/";
	let routes = input.routes;

	for (let i = 1; i < route.length; i++) {
		const routeCharacter = route[i];

		if (routeCharacter === "/") {
			routes = (
				routeSegment in routes ?
					routes[routeSegment] :
					routes["/*"]
			)[1];
			routeSegment = "/";
		} else {
			routeSegment += routeCharacter;
		}
	}

	return (
		routeSegment in routes ?
			routes[routeSegment] :
			routes["/*"]
	)[0](input);
}
