import { viewOld, viewOldUpdate, viewOldElement, viewOldElementUpdate } from "ravena/src/view/state";

const removeDataPropertyCache = {};
Node.prototype.RavenaChildren = null;

/**
 * Creates an element from a node.
 *
 * @param {object} node
 * @returns {object} element
 */
function दृश्यसृष्टि(node) {
	const nodeName = node.name;

	if (nodeName === "text") {
		// Create a text node using the text content from the default key.
		return document.createTextNode(node.data.data);
	} else {
		// Create a DOM element.
		const element = document.createElement(nodeName);

		// Set data.
		const nodeData = node.data;

		for (const key in nodeData) {
			const value = nodeData[key];

			if (key[0] === "o" && key[1] === "n") {
				// Set an event listener.
				element[key.toLowerCase()] = value;
			} else {
				switch (key) {
					case "attributes": {
						// Set attributes.
						for (const valueKey in value) {
							element.setAttribute(valueKey, value[valueKey]);
						}

						break;
					}
					case "style": {
						// Set style properties.
						const elementStyle = element.style;

						for (const valueKey in value) {
							elementStyle[valueKey] = value[valueKey];
						}

						break;
					}
					case "focus": {
						// Set focus if needed. Blur isn't set because it's the
						// default.
						if (value) {
							element.focus();
						}

						break;
					}
					case "class": {
						// Set a className property.
						element.className = value;

						break;
					}
					case "for": {
						// Set an htmlFor property.
						element.htmlFor = value;

						break;
					}
					case "children": {
						// Recursively append children.
						const elementRavenaChildren = element.RavenaChildren = [];

						for (let i = 0; i < value.length; i++) {
							const elementChild = दृश्यसृष्टि(value[i]);

							elementRavenaChildren.push(elementChild);
							element.appendChild(elementChild);
						}

						break;
					}
					default: {
						// Set a DOM property.
						element[key] = value;
					}
				}
			}
		}

		return element;
	}
}

/**
 * Patches an old element's data to match a new node, using an old node as
 * reference.
 *
 * @param {object} nodeOld
 * @param {object} nodeOldElement
 * @param {object} nodeNew
 */
function viewPatch(nodeOld, nodeOldElement, nodeNew) {
	const nodeOldData = nodeOld.data;
	const nodeNewData = nodeNew.data;

	// First, go through all new data and update all of the existing data to
	// match.
	for (const keyNew in nodeNewData) {
		const valueOld = nodeOldData[keyNew];
		const valueNew = nodeNewData[keyNew];

		if (valueOld !== valueNew) {
			if (keyNew[0] === "o" && keyNew[1] === "n") {
				// Update an event.
				nodeOldElement[keyNew.toLowerCase()] = valueNew;
			} else {
				switch (keyNew) {
					case "attributes": {
						// Update attributes.
						if (valueOld === undefined) {
							for (const valueNewKey in valueNew) {
								nodeOldElement.setAttribute(valueNewKey, valueNew[valueNewKey]);
							}
						} else {
							for (const valueNewKey in valueNew) {
								const valueNewValue = valueNew[valueNewKey];

								if (valueOld[valueNewKey] !== valueNewValue) {
									nodeOldElement.setAttribute(valueNewKey, valueNewValue);
								}
							}

							// Remove attributes from the old value that are not in
							// the new value.
							for (const valueOldKey in valueOld) {
								if (!(valueOldKey in valueNew)) {
									nodeOldElement.removeAttribute(valueOldKey);
								}
							}
						}

						break;
					}
					case "style": {
						// Update style properties.
						const nodeOldElementStyle = nodeOldElement.style;

						if (valueOld === undefined) {
							for (const valueNewKey in valueNew) {
								nodeOldElementStyle[valueNewKey] = valueNew[valueNewKey];
							}
						} else {
							for (const valueNewKey in valueNew) {
								const valueNewValue = valueNew[valueNewKey];

								if (valueOld[valueNewKey] !== valueNewValue) {
									nodeOldElementStyle[valueNewKey] = valueNewValue;
								}
							}

							// Remove style properties from the old value that are not
							// in the new value.
							for (const valueOldKey in valueOld) {
								if (!(valueOldKey in valueNew)) {
									nodeOldElementStyle[valueOldKey] = "";
								}
							}
						}

						break;
					}
					case "focus": {
						// Update focus/blur.
						if (valueNew) {
							nodeOldElement.focus();
						} else {
							nodeOldElement.blur();
						}

						break;
					}
					case "class": {
						// Update a className property.
						nodeOldElement.className = valueNew;

						break;
					}
					case "for": {
						// Update an htmlFor property.
						nodeOldElement.htmlFor = valueNew;

						break;
					}
					case "children": {
						// Update children.
						const valueNewLength = valueNew.length;

						if (valueOld === undefined) {
							// If there were no old children, create new children.
							const nodeOldElementRavenaChildren = nodeOldElement.RavenaChildren = [];

							for (let i = 0; i < valueNewLength; i++) {
								const nodeOldElementChild = दृश्यसृष्टि(valueNew[i]);

								nodeOldElementRavenaChildren.push(nodeOldElementChild);
								nodeOldElement.appendChild(nodeOldElementChild);
							}
						} else {
							const valueOldLength = valueOld.length;

							if (valueOldLength === valueNewLength) {
								// If the children have the same length then update
								// both as usual.
								const nodeOldElementRavenaChildren = nodeOldElement.RavenaChildren;

								for (let i = 0; i < valueOldLength; i++) {
									const valueOldNode = valueOld[i];
									const valueNewNode = valueNew[i];

									if (valueOldNode !== valueNewNode) {
										if (valueOldNode.name === valueNewNode.name) {
											viewPatch(valueOldNode, nodeOldElementRavenaChildren[i], valueNewNode);
										} else {
											const valueOldElementNew = दृश्यसृष्टि(valueNewNode);

											nodeOldElement.replaceChild(valueOldElementNew, nodeOldElementRavenaChildren[i]);

											nodeOldElementRavenaChildren[i] = valueOldElementNew;
										}
									}
								}
							} else if (valueOldLength > valueNewLength) {
								// If there are more old children than new children,
								// update the corresponding ones and remove the extra
								// old children.
								const nodeOldElementRavenaChildren = nodeOldElement.RavenaChildren;

								for (let i = 0; i < valueNewLength; i++) {
									const valueOldNode = valueOld[i];
									const valueNewNode = valueNew[i];

									if (valueOldNode !== valueNewNode) {
										if (valueOldNode.name === valueNewNode.name) {
											viewPatch(valueOldNode, nodeOldElementRavenaChildren[i], valueNewNode);
										} else {
											const valueOldElementNew = दृश्यसृष्टि(valueNewNode);

											nodeOldElement.replaceChild(valueOldElementNew, nodeOldElementRavenaChildren[i]);

											nodeOldElementRavenaChildren[i] = valueOldElementNew;
										}
									}
								}

								for (let i = valueNewLength; i < valueOldLength; i++) {
									nodeOldElement.removeChild(nodeOldElementRavenaChildren.pop());
								}
							} else {
								// If there are more new children than old children,
								// update the corresponding ones and append the extra
								// new children.
								const nodeOldElementRavenaChildren = nodeOldElement.RavenaChildren;

								for (let i = 0; i < valueOldLength; i++) {
									const valueOldNode = valueOld[i];
									const valueNewNode = valueNew[i];

									if (valueOldNode !== valueNewNode) {
										if (valueOldNode.name === valueNewNode.name) {
											viewPatch(valueOldNode, nodeOldElementRavenaChildren[i], valueNewNode);
										} else {
											const valueOldElementNew = दृश्यसृष्टि(valueNewNode);

											nodeOldElement.replaceChild(valueOldElementNew, nodeOldElementRavenaChildren[i]);

											nodeOldElementRavenaChildren[i] = valueOldElementNew;
										}
									}
								}

								for (let i = valueOldLength; i < valueNewLength; i++) {
									const nodeOldElementChild = दृश्यसृष्टि(valueNew[i]);

									nodeOldElementRavenaChildren.push(nodeOldElementChild);
									nodeOldElement.appendChild(nodeOldElementChild);
								}
							}
						}

						break;
					}
					default: {
						// Update a DOM property.
						nodeOldElement[keyNew] = valueNew;
					}
				}
			}
		}
	}

	// Next, go through all of the old data and remove data that isn't in the
	// new data.
	for (const keyOld in nodeOldData) {
		if (!(keyOld in nodeNewData)) {
			if (keyOld[0] === "o" && keyOld[1] === "n") {
				// Remove an event.
				nodeOldElement[keyOld.toLowerCase()] = null;
			} else {
				switch (keyOld) {
					case "attributes": {
						// Remove attributes.
						const valueOld = nodeOldData.attributes;

						for (const valueOldKey in valueOld) {
							nodeOldElement.removeAttribute(valueOldKey);
						}

						break;
					}
					case "focus": {
						// Remove focus.
						nodeOldElement.blur();

						break;
					}
					case "class": {
						// Remove a className property.
						nodeOldElement.className = "";

						break;
					}
					case "for": {
						// Remove an htmlFor property.
						nodeOldElement.htmlFor = "";

						break;
					}
					case "children": {
						// Remove children.
						const valueOldLength = nodeOldData.children.length;
						const nodeOldElementRavenaChildren = nodeOldElement.RavenaChildren;

						for (let i = 0; i < valueOldLength; i++) {
							nodeOldElement.removeChild(nodeOldElementRavenaChildren.pop());
						}

						break;
					}
					default: {
						// Remove a DOM property.
						const nodeOldName = nodeOld.name;
						nodeOldElement[keyOld] = (
							nodeOldName in removeDataPropertyCache ?
								removeDataPropertyCache[nodeOldName] :
								(
									removeDataPropertyCache[nodeOldName] =
										nodeOldName === "text" ?
											document.createTextNode("") :
											document.createElement(nodeOldName)
								)
						)[keyOld];
					}
				}
			}
		}
	}
}

/**
 * The view transformer renderer is responsible for updating the DOM and
 * rendering views. The patch consists of walking the new tree and finding
 * differences between the trees. The old tree is used to compare values for
 * performance. The DOM is updated to reflect these changes as well. Ideally,
 * the DOM would provide an API for creating lightweight elements and render
 * directly from a virtual DOM, but Moon uses the imperative API for updating
 * it instead.
 *
 * Since views can easily be cached, Moon skips over patches if the old and new
 * nodes are equal. This is also why views should be pure and immutable. They
 * are created every render and stored, so if they are ever mutated, Moon will
 * skip them anyway because they have the same reference. It can use a little
 * more memory, but Moon nodes are heavily optimized to work well with
 * JavaScript engines, and immutability opens up the opportunity to use
 * standard functional techniques for caching.
 *
 * @param {object} viewNew
 */
export default {
	set(viewNew) {
		// When given a new view, patch the old element to match the new node using
		// the old node as reference.
		if (viewOld.name === viewNew.name) {
			// If the root views have the same name, patch their data.
			viewPatch(viewOld, viewOldElement, viewNew);
		} else {
			// If they have different names, create a new old view element.
			const viewOldElementNew = दृश्यसृष्टि(viewNew);

			// Manipulate the DOM to replace the old view.
			viewOldElement.parentNode.replaceChild(viewOldElementNew, viewOldElement);

			// Update the reference to the old view element.
			viewOldElementUpdate(viewOldElementNew);
		}

		// Store the new view as the old view to be used as reference during a
		// patch.
		viewOldUpdate(viewNew);
	}
};
