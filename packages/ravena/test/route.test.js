import Ravena from "ravena/src/index";
const m = Ravena.m;

test("provides route as input", () => {
	expect(m.route).toEqual("/");
});

test("changes route for output", () => {
	expect(m.route).toEqual("/");
	m.route = "/test";
	expect(m.route).toEqual("/test");
	m.route = "/test/foo";
	expect(m.route).toEqual("/test/foo");
});

test("router view", () => {
	const view = route => data => <Ravena.view.components.p>{route}{data.route}{data.test}</Ravena.view.components.p>;
	const data = route => ({ route, test: "test-ravena-route" });
	const routes = {
		"/": [view("/"), {}],
		"/foo": [view("/foo"), {
			"/bar": [view("/foo/bar"), {}],
			"/baz": [view("/foo/baz"), {}],
			"/*": [view("/foo/*"), {
				"/test": [view("/foo/*/test"), {}]
			}]
		}],
		"/*": [view("/*"), {}]
	};

	expect(<Ravena.route.router test="test-ravena-route" route="/" routes=routes/>).toEqual(view("/")(data("/")));
	expect(<Ravena.route.router test="test-ravena-route" route="/foo" routes=routes/>).toEqual(view("/foo")(data("/foo")));
	expect(<Ravena.route.router test="test-ravena-route" route="/foo/bar" routes=routes/>).toEqual(view("/foo/bar")(data("/foo/bar")));
	expect(<Ravena.route.router test="test-ravena-route" route="/unknown" routes=routes/>).toEqual(view("/*")(data("/unknown")));
	expect(<Ravena.route.router test="test-ravena-route" route="/foo/unknown" routes=routes/>).toEqual(view("/foo/*")(data("/foo/unknown")));
	expect(<Ravena.route.router test="test-ravena-route" route="/foo/unknown/test" routes=routes/>).toEqual(view("/foo/*/test")(data("/foo/unknown/test")));
});
