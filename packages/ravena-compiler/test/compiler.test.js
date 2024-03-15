import compiler from "ravena-compiler/src/index";

console.error = jest.fn(() => {});

test("report parse errors", () => {
	expect(() => compiler.compile(`<div test="/>`).constructor.name).toThrow();
	expect(console.error).toBeCalledWith(`[Ravena] त्रुटि: किं करोषि परथ - पार्सरं प्रति अमान्यनिवेशः ।\n\nनिवेशस्य विश्लेषणं कर्तुं प्रयत्नः कृतः ।\n\nअपेक्षित \"\"\".\n\nप्राप्तः:\n\n1| <div test=\"/> \n |              ^`);
});
