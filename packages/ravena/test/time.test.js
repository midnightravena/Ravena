import Ravena from "ravena/src/index";
const m = Ravena.m;

test("time as input", () => {
	window.Date.now = jest.fn(() => 7);

	expect(m.time).toEqual(7);
	expect(Date.now).toBeCalled();
});

test("setting timeouts", () => {
	window.setTimeout = jest.fn((fn, delay) => {});

	const input = [7, () => {}];
	m.time = input;

	expect(setTimeout).toBeCalledWith(input[1], input[0] * 1000);
});
