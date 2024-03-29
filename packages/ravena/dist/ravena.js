(function(root, factory) {
	if (typeof module === "undefined") {
		root.Ravena = factory();
	} else {
		module.exports = factory();
	}
}(this, function() {
	"use strict";

	/**
	 * View Node Constructor
	 *
	 * @param {string} name
	 * @param {object} data
	 */
	function ViewNode(name, data) {
		this.name = name;
		this.data = data;
	}

	/**
	 * Global old view.
	 */
	var viewOld = null;
	/**
	 * Global old view element.
	 */

	var viewOldElement = null;
	/**
	 * Update the old view.
	 *
	 * @param {object} viewOldNew
	 */

	function viewOldUpdate(viewOldNew) {
		viewOld = viewOldNew;
	}
	/**
	 * Update the old view element.
	 *
	 * @param {object} viewOldElementNew
	 */

	function viewOldElementUpdate(viewOldElementNew) {
		viewOldElement = viewOldElementNew;
	}

	/**
	 * Mount to a DOM element.
	 */

	function mount(element) {
		viewOldElementUpdate(element); // Capture old data from the element's attributes.

		var viewOldElementAttributes = viewOldElement.attributes;
		var viewOldData = {};

		for (var i = 0; i < viewOldElementAttributes.length; i++) {
			var viewOldElementAttribute = viewOldElementAttributes[i];
			viewOldData[viewOldElementAttribute.name] = viewOldElementAttribute.value;
		} // Create a node from the root element.


		viewOldUpdate(new ViewNode(viewOldElement.tagName.toLowerCase(), viewOldData));
	}

	/**
	 * HTML tag names
	 */
	var names = ["a", "abbr", "acronym", "address", "applet", "area", "article", "aside", "audio", "b", "base", "basefont", "bdi", "bdo", "bgsound", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "command", "content", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "embed", "fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "iframe", "image", "img", "input", "ins", "isindex", "kbd", "keygen", "label", "legend", "li", "link", "listing", "main", "map", "mark", "marquee", "math", "menu", "menuitem", "meta", "meter", "multicol", "nav", "nextid", "nobr", "noembed", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "picture", "plaintext", "pre", "progress", "q", "rb", "rbc", "rp", "rt", "rtc", "ruby", "s", "samp", "script", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "svg", "table", "tbody", "td", "template", "text", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt", "u", "ul", "var", "video", "wbr", "xmp"];

	/**
	 * Components
	 *
	 * Each component generates a corresponding view node based on the data it is
	 * passed as input. This data includes attributes and children.
	 */

	var components = {
		node: function node(name) {
			return function (data) {
				return new ViewNode(name, data);
			};
		}
	};

	var _loop = function _loop(i) {
		var name = names[i];

		components[name] = function (data) {
			return new ViewNode(name, data);
		};
	};

	for (var i = 0; i < names.length; i++) {
		_loop(i);
	}

	var view = {
		components: components,
		mount: mount
	};

	/**
	 * Returns a view given routes that map to views and the current route.
	 *
	 * @param {object} input
	 * @returns {object} view
	 */
	function router(input) {
		var route = input.route;
		var routeSegment = "/";
		var routes = input.routes;

		for (var i = 1; i < route.length; i++) {
			var routeCharacter = route[i];

			if (routeCharacter === "/") {
				routes = (routeSegment in routes ? routes[routeSegment] : routes["/*"])[1];
				routeSegment = "/";
			} else {
				routeSegment += routeCharacter;
			}
		}

		return (routeSegment in routes ? routes[routeSegment] : routes["/*"])[0](input);
	}

	var route = {
		router: router
	};

	var data = {};

	/**
	 * Cache for default property values
	 */

	var removeDataPropertyCache = {};
	/**
	 * Modify the prototype of a node to include special Ravena view properties.
	 */

	Node.prototype.RavenaChildren = null;
	/**
	 * Creates an element from a node.
	 *
	 * @param {object} node
	 * @returns {object} element
	 */

	function viewCreate(node) {
		var nodeName = node.name;

		if (nodeName === "text") {
			// Create a text node using the text content from the default key.
			return document.createTextNode(node.data.data);
		} else {
			// Create a DOM element.
			var element = document.createElement(nodeName); // Set data.

			var nodeData = node.data;

			for (var key in nodeData) {
				var value = nodeData[key];

				if (key[0] === "o" && key[1] === "n") {
					// Set an event listener.
					element[key.toLowerCase()] = value;
				} else {
					switch (key) {
						case "attributes":
							{
								// Set attributes.
								for (var valueKey in value) {
									element.setAttribute(valueKey, value[valueKey]);
								}

								break;
							}

						case "style":
							{
								// Set style properties.
								var elementStyle = element.style;

								for (var _valueKey in value) {
									elementStyle[_valueKey] = value[_valueKey];
								}

								break;
							}

						case "focus":
							{
								// Set focus if needed. Blur isn't set because it's the
								// default.
								if (value) {
									element.focus();
								}

								break;
							}

						case "class":
							{
								// Set a className property.
								element.className = value;
								break;
							}

						case "for":
							{
								// Set an htmlFor property.
								element.htmlFor = value;
								break;
							}

						case "children":
							{
								// Recursively append children.
								var elementRavenaChildren = element.RavenaChildren = [];

								for (var i = 0; i < value.length; i++) {
									var elementChild = viewCreate(value[i]);
									elementRavenaChildren.push(elementChild);
									element.appendChild(elementChild);
								}

								break;
							}

						default:
							{
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
		var nodeOldData = nodeOld.data;
		var nodeNewData = nodeNew.data; // First, go through all new data and update all of the existing data to
		// match.

		for (var keyNew in nodeNewData) {
			var valueOld = nodeOldData[keyNew];
			var valueNew = nodeNewData[keyNew];

			if (valueOld !== valueNew) {
				if (keyNew[0] === "o" && keyNew[1] === "n") {
					// Update an event.
					nodeOldElement[keyNew.toLowerCase()] = valueNew;
				} else {
					switch (keyNew) {
						case "attributes":
							{
								// Update attributes.
								if (valueOld === undefined) {
									for (var valueNewKey in valueNew) {
										nodeOldElement.setAttribute(valueNewKey, valueNew[valueNewKey]);
									}
								} else {
									for (var _valueNewKey in valueNew) {
										var valueNewValue = valueNew[_valueNewKey];

										if (valueOld[_valueNewKey] !== valueNewValue) {
											nodeOldElement.setAttribute(_valueNewKey, valueNewValue);
										}
									} // Remove attributes from the old value that are not in
									// the new value.


									for (var valueOldKey in valueOld) {
										if (!(valueOldKey in valueNew)) {
											nodeOldElement.removeAttribute(valueOldKey);
										}
									}
								}

								break;
							}

						case "style":
							{
								// Update style properties.
								var nodeOldElementStyle = nodeOldElement.style;

								if (valueOld === undefined) {
									for (var _valueNewKey2 in valueNew) {
										nodeOldElementStyle[_valueNewKey2] = valueNew[_valueNewKey2];
									}
								} else {
									for (var _valueNewKey3 in valueNew) {
										var _valueNewValue = valueNew[_valueNewKey3];

										if (valueOld[_valueNewKey3] !== _valueNewValue) {
											nodeOldElementStyle[_valueNewKey3] = _valueNewValue;
										}
									} // Remove style properties from the old value that are not
									// in the new value.


									for (var _valueOldKey in valueOld) {
										if (!(_valueOldKey in valueNew)) {
											nodeOldElementStyle[_valueOldKey] = "";
										}
									}
								}

								break;
							}

						case "focus":
							{
								// Update focus/blur.
								if (valueNew) {
									nodeOldElement.focus();
								} else {
									nodeOldElement.blur();
								}

								break;
							}

						case "class":
							{
								// Update a className property.
								nodeOldElement.className = valueNew;
								break;
							}

						case "for":
							{
								// Update an htmlFor property.
								nodeOldElement.htmlFor = valueNew;
								break;
							}

						case "children":
							{
								// Update children.
								var valueNewLength = valueNew.length;

								if (valueOld === undefined) {
									// If there were no old children, create new children.
									var nodeOldElementRavenaChildren = nodeOldElement.RavenaChildren = [];

									for (var i = 0; i < valueNewLength; i++) {
										var nodeOldElementChild = viewCreate(valueNew[i]);
										nodeOldElementRavenaChildren.push(nodeOldElementChild);
										nodeOldElement.appendChild(nodeOldElementChild);
									}
								} else {
									var valueOldLength = valueOld.length;

									if (valueOldLength === valueNewLength) {
										// If the children have the same length then update
										// both as usual.
										var _nodeOldElementRavenaChildren = nodeOldElement.RavenaChildren;

										for (var _i = 0; _i < valueOldLength; _i++) {
											var valueOldNode = valueOld[_i];
											var valueNewNode = valueNew[_i];

											if (valueOldNode !== valueNewNode) {
												if (valueOldNode.name === valueNewNode.name) {
													viewPatch(valueOldNode, _nodeOldElementRavenaChildren[_i], valueNewNode);
												} else {
													var valueOldElementNew = viewCreate(valueNewNode);
													nodeOldElement.replaceChild(valueOldElementNew, _nodeOldElementRavenaChildren[_i]);
													_nodeOldElementRavenaChildren[_i] = valueOldElementNew;
												}
											}
										}
									} else if (valueOldLength > valueNewLength) {
										// If there are more old children than new children,
										// update the corresponding ones and remove the extra
										// old children.
										var _nodeOldElementRavenaChildren2 = nodeOldElement.RavenaChildren;

										for (var _i2 = 0; _i2 < valueNewLength; _i2++) {
											var _valueOldNode = valueOld[_i2];
											var _valueNewNode = valueNew[_i2];

											if (_valueOldNode !== _valueNewNode) {
												if (_valueOldNode.name === _valueNewNode.name) {
													viewPatch(_valueOldNode, _nodeOldElementRavenaChildren2[_i2], _valueNewNode);
												} else {
													var _valueOldElementNew = viewCreate(_valueNewNode);

													nodeOldElement.replaceChild(_valueOldElementNew, _nodeOldElementRavenaChildren2[_i2]);
													_nodeOldElementRavenaChildren2[_i2] = _valueOldElementNew;
												}
											}
										}

										for (var _i3 = valueNewLength; _i3 < valueOldLength; _i3++) {
											nodeOldElement.removeChild(_nodeOldElementRavenaChildren2.pop());
										}
									} else {
										// If there are more new children than old children,
										// update the corresponding ones and append the extra
										// new children.
										var _nodeOldElementRavenaChildren3 = nodeOldElement.RavenaChildren;

										for (var _i4 = 0; _i4 < valueOldLength; _i4++) {
											var _valueOldNode2 = valueOld[_i4];
											var _valueNewNode2 = valueNew[_i4];

											if (_valueOldNode2 !== _valueNewNode2) {
												if (_valueOldNode2.name === _valueNewNode2.name) {
													viewPatch(_valueOldNode2, _nodeOldElementRavenaChildren3[_i4], _valueNewNode2);
												} else {
													var _valueOldElementNew2 = viewCreate(_valueNewNode2);

													nodeOldElement.replaceChild(_valueOldElementNew2, _nodeOldElementRavenaChildren3[_i4]);
													_nodeOldElementRavenaChildren3[_i4] = _valueOldElementNew2;
												}
											}
										}

										for (var _i5 = valueOldLength; _i5 < valueNewLength; _i5++) {
											var _nodeOldElementChild = viewCreate(valueNew[_i5]);

											_nodeOldElementRavenaChildren3.push(_nodeOldElementChild);

											nodeOldElement.appendChild(_nodeOldElementChild);
										}
									}
								}

								break;
							}

						default:
							{
								// Update a DOM property.
								nodeOldElement[keyNew] = valueNew;
							}
					}
				}
			}
		} // Next, go through all of the old data and remove data that isn't in the
		// new data.


		for (var keyOld in nodeOldData) {
			if (!(keyOld in nodeNewData)) {
				if (keyOld[0] === "o" && keyOld[1] === "n") {
					// Remove an event.
					nodeOldElement[keyOld.toLowerCase()] = null;
				} else {
					switch (keyOld) {
						case "attributes":
							{
								// Remove attributes.
								var _valueOld = nodeOldData.attributes;

								for (var _valueOldKey2 in _valueOld) {
									nodeOldElement.removeAttribute(_valueOldKey2);
								}

								break;
							}

						case "focus":
							{
								// Remove focus.
								nodeOldElement.blur();
								break;
							}

						case "class":
							{
								// Remove a className property.
								nodeOldElement.className = "";
								break;
							}

						case "for":
							{
								// Remove an htmlFor property.
								nodeOldElement.htmlFor = "";
								break;
							}

						case "children":
							{
								// Remove children.
								var _valueOldLength = nodeOldData.children.length;
								var _nodeOldElementRavenaChildren4 = nodeOldElement.RavenaChildren;

								for (var _i6 = 0; _i6 < _valueOldLength; _i6++) {
									nodeOldElement.removeChild(_nodeOldElementRavenaChildren4.pop());
								}

								break;
							}

						default:
							{
								// Remove a DOM property.
								var nodeOldName = nodeOld.name;
								nodeOldElement[keyOld] = (nodeOldName in removeDataPropertyCache ? removeDataPropertyCache[nodeOldName] : removeDataPropertyCache[nodeOldName] = nodeOldName === "text" ? document.createTextNode("") : document.createElement(nodeOldName))[keyOld];
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
	 * directly from a virtual DOM, but Ravena uses the imperative API for updating
	 * it instead.
	 *
	 * Since views can easily be cached, Ravena skips over patches if the old and new
	 * nodes are equal. This is also why views should be pure and immutable. They
	 * are created every render and stored, so if they are ever mutated, Ravena will
	 * skip them anyway because they have the same reference. It can use a little
	 * more memory, but Ravena nodes are heavily optimized to work well with
	 * JavaScript engines, and immutability opens up the opportunity to use
	 * standard functional techniques for caching.
	 *
	 * @param {object} viewNew
	 */


	var view$1 = {
		set: function set(viewNew) {
			// When given a new view, patch the old element to match the new node using
			// the old node as reference.
			if (viewOld.name === viewNew.name) {
				// If the root views have the same name, patch their data.
				viewPatch(viewOld, viewOldElement, viewNew);
			} else {
				// If they have different names, create a new old view element.
				var viewOldElementNew = viewCreate(viewNew); // Manipulate the DOM to replace the old view.

				viewOldElement.parentNode.replaceChild(viewOldElementNew, viewOldElement); // Update the reference to the old view element.

				viewOldElementUpdate(viewOldElementNew);
			} // Store the new view as the old view to be used as reference during a
			// patch.


			viewOldUpdate(viewNew);
		}
	};

	var time = {
		get: function get() {
			return Date.now();
		},
		set: function set(input) {
			setTimeout(input[1], input[0] * 1000);
		}
	};

	var storage = {
		get: function get() {
			return localStorage;
		},
		set: function set(localStorageNew) {
			for (var keyNew in localStorageNew) {
				var valueNew = localStorageNew[keyNew];

				if (localStorage[keyNew] !== valueNew) {
					localStorage[keyNew] = valueNew;
				}
			}

			for (var keyOld in localStorage) {
				if (!(keyOld in localStorageNew)) {
					delete localStorage[keyOld];
				}
			}
		}
	};

	/*
	 * Match HTTP headers.
	 */
	var शीर्षिका = /^([^:]+):\s*([^]*?)\s*$/gm;
	var http = {
		set: function set(request) {
			var xhr = new XMLHttpRequest(); // Handle response types.

			xhr.responseType = "responseType" in request ? request.responseType : "text"; // Handle load event.

			if ("onLoad" in request) {
				xhr.onload = function () {
					var responseHeaders = {};
					var responseHeadersText = xhr.getAllResponseHeaders();
					var responseHeader; // Parse headers to object.

					while ((responseHeader = शीर्षिका.exec(responseHeadersText)) !== null) {
						responseHeaders[responseHeader[1]] = responseHeader[2];
					} // Run load event handler.


					request.onLoad({
						status: xhr.status,
						headers: responseHeaders,
						body: xhr.response
					});
				};
			} // Handle error event.


			if ("onError" in request) {
				xhr.onerror = request.onError;
			} // Open the request with the given method and URL.


			xhr.open("method" in request ? request.method : "GET", request.url); // Set request headers.

			if ("headers" in request) {
				var requestHeaders = request.headers;

				for (var requestHeader in requestHeaders) {
					xhr.setRequestHeader(requestHeader, requestHeaders[requestHeader]);
				}
			} // Send the request with the given body.


			xhr.send("body" in request ? request.body : null);
		}
	};

	var route$1 = {
		get: function get() {
			return location.pathname;
		},
		set: function set(routeNew) {
			history.pushState(null, "", routeNew);
		}
	};

	var raven = {};
	raven.data = data;
	Object.defineProperty(raven, "view", view$1);
	Object.defineProperty(raven, "time", time);
	Object.defineProperty(raven, "storage", storage);
	Object.defineProperty(raven, "http", http);
	Object.defineProperty(raven, "route", route$1);

	var index = {
		raven: raven,
		route: route,
		version: "1.0.0",
		view: view
	};

	return index;
}));
