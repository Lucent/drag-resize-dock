var externalWiki, wikibox, wikititle, firstWiki = true, blockClick, resizetype;
var options = {
	showContentsWhileChanging: true,		// show/hide iframe while dragging or resizing for performance reasons
	opacityWhileChanging: 1,				// set to 1 disable
	dockedFrameSize: "50%",					// initial height or width of frame when docked at an edge
	openWindowAtEdge: true,					// when dragged to edge, attempt to open window
};

function init() {
	var anchors = document.getElementsByTagName("a");
	[...anchors].forEach(anchor => {
		if (anchor.classList.contains("DragResizeDock"))
			anchor.onclick = click_wiki;
	});
	wikibox = document.getElementById("WikiBox");
	wikititle = document.getElementById("WikiTitle");
	document.getElementById("WikiFrame").onreadystatechange =
	document.getElementById("WikiFrame").onload = iframe_loaded;
};

var startWikiDrag = function(e) {
	wikibox.classList.remove("Expanding");
	if (!options.showContentsWhileChanging)
		document.getElementById("WikiFrameBox").style.display = wikibox.getElementsByTagName("p")[0].style.display = "none";
	wikititle.classList.add("Active");
	set_opacity(wikibox, options.opacityWhileChanging);
	save_wiki_location(e, wikibox);
	e.cancelBubble = true;
	document.onmousemove = moveWiki;
	document.onmouseup = releaseWiki;
	e.preventDefault();
};

var save_wiki_location = function(e, el) {
	el.startX = el.offsetLeft;
	el.startY = el.offsetTop;
	el.startWidth = el.offsetWidth;
	el.startHeight = el.offsetHeight;
	el.mouseStartX = e.clientX;
	el.mouseStartY = e.clientY;
	el.pageX = e.pageX || e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
	el.pageY = e.pageY || e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
};

var moveWiki = function(e) {
	var gap = 10, dock_pct;
	if (wikibox.dockSize && wikibox.dockSize.indexOf("px") === -1)
		dock_pct = wikibox.dockSize;
	else
		dock_pct = options.dockedFrameSize;

	if (wikibox.saveHeight) {
		undock();
		restoreSize(false);
	} else if (e.clientY <= gap) {
		snap_to(0, 0, 0, 0, "auto", "auto");
		return;
	} else if (e.clientX <= gap) {
		if (tearoff_window(e, false) !== true) snap_to(0, "auto", 0, 0, dock_pct, "auto");
		return;
	} else if (e.clientX >= document.documentElement.clientWidth - gap) {
		if (tearoff_window(e, false) !== true) snap_to(0, 0, 0, "auto", dock_pct, "auto");
		return;
	} else if (e.clientY >= document.documentElement.clientHeight - gap) {
		if (tearoff_window(e, false) !== true) snap_to("auto", 0, 0, 0, "auto", dock_pct);
		return;
	}
	wikibox.style.left = wikibox.startX + e.clientX - wikibox.mouseStartX + "px";
	wikibox.style.top = wikibox.startY + e.clientY - wikibox.mouseStartY + "px";
	return false;
};

var snap_to = function(top, right, bottom, left, width, height) {
	var border = 5;
	if (!wikibox.saveHeight) {
		wikibox.saveHeight = wikibox.offsetHeight;
		wikibox.saveWidth = wikibox.offsetWidth;
		wikibox.saveTop = wikibox.offsetTop;
		wikibox.saveLeft = wikibox.offsetLeft;
	}
	wikibox.style.top = top;
	wikibox.style.right = right;
	wikibox.style.bottom = bottom;
	wikibox.style.left = left;
	wikibox.style.width = width;
	wikibox.style.height = height;
	wikibox.style.borderRadius = wikititle.style.borderRadius = 0;

	if (String(top).charAt(0) === "0") {
		var newWidth = parseInt(width, 10) + border*2 / document.documentElement.clientWidth * 100;
		if (right === "auto") {
			document.documentElement.style.width = "100%";
			document.documentElement.style.marginLeft = newWidth + "%";
			document.body.scrollLeft = document.documentElement.scrollLeft = 0;
		} else if (left === "auto") {
			wikibox.bodyWidth = document.documentElement.scrollWidth / document.documentElement.offsetWidth * 100;
			document.documentElement.style.width = wikibox.bodyWidth + newWidth + "%";
			document.body.style.width = wikibox.bodyWidth / (wikibox.bodyWidth + newWidth) * 100 + "%";
			document.body.scrollLeft = document.documentElement.scrollLeft = document.documentElement.scrollWidth - document.documentElement.clientWidth;
		}
	} else {
		var newHeight = parseInt(height, 10) + border*2 / document.documentElement.clientHeight * 100;
		wikibox.pageHeight = document.body.offsetHeight / document.documentElement.clientHeight * 100;
		document.documentElement.style.height = wikibox.pageHeight + newHeight + "%";
		document.body.scrollTop = document.documentElement.scrollTop = document.documentElement.scrollHeight - document.documentElement.clientHeight;
	}
	releaseWiki();
};

var determineResizeType = function(e) {
	if (wikibox.getElementsByTagName("p")[0].style.display === "none") {
		var frac = 20;
		resizetype = "";
		if (wikibox.offsetTop + wikibox.offsetHeight / frac > e.clientY)
			resizetype += "N";
		else if (wikibox.offsetTop + wikibox.offsetHeight * (frac-1) / frac < e.clientY)
			resizetype += "S";

		if (wikibox.offsetLeft + wikibox.offsetWidth / frac > e.clientX)
			resizetype += "W";
		else if (wikibox.offsetLeft + wikibox.offsetWidth * (frac-1) / frac < e.clientX)
			resizetype += "E";

		if (resizetype !== "")
			wikibox.style.cursor = resizetype + "-resize";
	} else
		wikibox.style.cursor = "";
};

var startResize = function(e) {
	if (!options.showContentsWhileChanging)
		document.getElementById("WikiFrameBox").style.display = wikibox.getElementsByTagName("p")[0].style.display = "none";
	wikititle.classList.add("Active");
	set_opacity(wikibox, options.opacityWhileChanging);
	save_wiki_location(e, wikibox);
	determineResizeType(e);
	wikibox.onmouseover = null;
	document.onmousemove = duringResize;
	document.onmouseup = releaseWiki;
	if (e.preventDefault) e.preventDefault();
};

var duringResize = function(e) {
	var minsize = {x: 300, y: 100}, gap = 10, border = 5,
		distX = wikibox.mouseStartX - e.clientX,
		distY = wikibox.mouseStartY - e.clientY;

	if (e.clientY <= gap || e.clientY >= document.documentElement.clientHeight - gap) {
		if (wikibox.offsetTop) wikibox.saveTop = wikibox.offsetTop;
		wikibox.style.height = "auto";
		wikibox.style.top = wikibox.style.bottom = 0;
		wikibox.style.borderRadius = wikititle.style.borderRadius = 0;
		return false;
	} else if (document.documentElement.style.height || document.documentElement.style.width) {
		var attach_if_closer = 50;
		if (resizetype.indexOf("N") !== -1 && document.documentElement.style.height) {
			wikibox.style.height = Math.max(minsize.y, wikibox.startHeight + distY - border*2) / document.documentElement.clientHeight * 100 + "%";
			document.documentElement.style.height = wikibox.pageHeight + wikibox.offsetHeight / document.documentElement.clientHeight * 100 + "%";
			if ((document.documentElement.scrollHeight - document.documentElement.clientHeight) - (window.pageYOffset || document.documentElement.scrollTop) < attach_if_closer)
				document.body.scrollTop = document.documentElement.scrollTop = document.documentElement.scrollHeight - document.documentElement.clientHeight;
		} else if (resizetype.indexOf("E") !== -1 && wikibox.style.right === "auto") {
			wikibox.style.width = Math.max(minsize.x, wikibox.startWidth - distX - border*2) / document.documentElement.clientWidth * 100 + "%";
			document.documentElement.style.marginLeft = wikibox.offsetWidth / document.documentElement.clientWidth * 100 + "%";
		} else if (resizetype.indexOf("W") !== -1 && wikibox.style.left === "auto") {
			wikibox.style.width = Math.max(minsize.x, wikibox.startWidth + distX - border*2) / document.documentElement.clientWidth * 100 + "%";
			var newWidth = wikibox.offsetWidth / document.documentElement.clientWidth * 100;
			document.documentElement.style.width = wikibox.bodyWidth + newWidth + "%";
			document.body.style.width = wikibox.bodyWidth / (wikibox.bodyWidth + newWidth) * 100 + "%";
			if ((document.documentElement.scrollWidth - document.documentElement.clientWidth) - (window.pageXOffset || document.documentElement.scrollLeft) < attach_if_closer)
				document.body.scrollLeft = document.documentElement.scrollLeft = document.documentElement.scrollWidth - document.documentElement.clientWidth;
		}
		return false;
	} else if (wikibox.saveTop) {
		wikibox.style.borderRadius = wikititle.style.borderRadius = "";
		wikibox.style.top = wikibox.saveTop + "px";
		wikibox.saveTop = 0;
		wikibox.style.bottom = "";
	}

	if (resizetype.indexOf("N") !== -1) {
		wikibox.style.top = wikibox.startY - distY + "px";
		wikibox.style.height = Math.max(minsize.y, wikibox.startHeight + distY - border*2) + "px";
	} else if (resizetype.indexOf("S") !== -1) {
		wikibox.style.height = Math.max(minsize.y, wikibox.startHeight - distY - border*2) + "px";
	}

	if (resizetype.indexOf("W") !== -1) {
		wikibox.style.left = wikibox.startX - distX + "px";
		wikibox.style.width = Math.max(minsize.x, wikibox.startWidth + distX - border*2) + "px";
	} else if (resizetype.indexOf("E") !== -1) {
		wikibox.style.width = Math.max(minsize.x, wikibox.startWidth - distX - border*2) + "px";
	}
	return false;
};

var tearoff_window = function(e, navigate) {
	wikibox.classList.remove("Expanding");
	save_wiki_location(e, wikibox);
	var isChrome = navigator.userAgent.indexOf("Chrome") !== -1;
	var xOffset = window.pageXOffset || document.documentElement.scrollLeft;
	var yOffset = window.pageYOffset || document.documentElement.scrollTop;
	if (!isChrome && open_wiki_window([e.screenX - wikibox.pageX + wikibox.startX + xOffset, e.screenY - wikibox.pageY + wikibox.startY + yOffset], [wikibox.offsetWidth, wikibox.offsetHeight]) != null) {
		destroy();
		wikibox.style.left = wikibox.style.top = wikibox.style.height = wikibox.style.width = "";
		firstWiki = true;
		return true;
	} else if (navigate !== false)
		snap_to(0, 0, 0, 0, "auto", "auto");
};

var releaseWiki = function() {
	document.onmousemove = null;
	document.onmouseup = null;
	wikititle.classList.remove("Active");
	wikibox.onmouseover = determineResizeType;
	set_opacity(wikibox, 1);
	document.getElementById("WikiFrameBox").style.display = "";
};

var doubleClickTitle = function(e) {
	if (wikibox.saveHeight) {
		undock();
		restoreSize(true);
	} else
		snap_to(0, 0, 0, 0, "auto", "auto");
	if (e.stopPropagation) e.stopPropagation();
};

var open_wiki_window = function(pos, size) {
	releaseWiki();
	for (var x = 0; x < pos.length; x++)
		pos[x] = Math.max(0, pos[x]);
	externalWiki = window.open(wikibox.externalHref, "WikiWindow", "width="+size[0]+",height="+size[1]+",left="+pos[0]+",top="+pos[1]+",resizable=yes,scrollbars=yes,location=yes");
	return externalWiki;
};

var click_wiki = function(e) {
	var el = (e.target || e.srcElement), article, url;

	if (screen.width * screen.height < 1024 * 600 ||				// Skip for small tablets
		!navigator.onLine || e.ctrlKey || e.shiftKey ||				// Passthrough Shift, Ctrl click
		(e.button && (e.button === 4 || e.button === 2)))			// Passthrough middle click
	return;

	article = el.getAttribute("title");

	document.getElementById("ElementName").innerHTML = article;
	document.getElementById("ElementName").href = el.href;

	url = el.href;

	if (externalWiki && !externalWiki.closed) {
		externalWiki.location.href = url;
		externalWiki.focus();
	} else {
		document.getElementById("WikiFrameBox").style.display = "none";
		window.frames["WikiFrame"].location.replace(url);
		wikibox.externalHref = url;

		if (firstWiki === true) {
			wikititle.onmousedown = startWikiDrag;
			wikibox.onmousedown = startResize;

			var elementPos = findPos(el, [0, 0]),
				xOffset = window.pageXOffset || document.documentElement.scrollLeft,
				yOffset = window.pageYOffset || document.documentElement.scrollTop,
				sty = document.styleSheets[0];
			if (sty.cssRules && sty.cssRules[0].selectorText === "#WikiBox") sty.deleteRule(0);
			if (sty.insertRule) sty.insertRule("#WikiBox { left: " + (-elementPos[0] - xOffset) / document.documentElement.clientWidth * 100 + "%; top: " + (-elementPos[1] - yOffset) / document.documentElement.clientHeight * 100 + "%; width: " + el.offsetWidth / document.documentElement.clientWidth * 100 + "%; height: " + el.offsetHeight / document.documentElement.clientHeight * 100 + "%; }", 0);
			wikibox.classList.add("Expanding");

			var q = wikibox.offsetWidth; // quantum mechanical nonsense
			wikibox.classList.add("Expanded");
			firstWiki = false;
		} else {
			if (!wikibox.classList.contains("Expanded") && (wikibox.style.height === "auto" || wikibox.style.width === "auto"))
				snap_to(wikibox.style.top, wikibox.style.right, wikibox.style.bottom, wikibox.style.left, wikibox.style.width, wikibox.style.height);
			wikibox.classList.add("Expanded");
		}
	}

	blockClick = true;
	return false;
};

var undock = function(restorepos) {
	document.documentElement.style.height = document.documentElement.style.width = document.documentElement.style.marginLeft = document.body.style.width = "";
	wikibox.dockSize = wikibox.style.width === "auto" ? wikibox.style.height : wikibox.style.width;
	wikibox.style.borderRadius = wikititle.style.borderRadius = "";
};

var restoreSize = function(andposition) {
	wikibox.style.height = wikibox.saveHeight + "px";
	if (wikibox.saveWidth) wikibox.style.width = wikibox.saveWidth + "px";
	if (andposition) {
		wikibox.style.left = wikibox.saveLeft + "px";
		wikibox.style.top = wikibox.saveTop + "px";
	}
	wikibox.saveHeight = wikibox.saveTop = 0;
};

var destroy = function() {
	window.frames["WikiFrame"].location.replace("about:blank");
	wikibox.classList.remove("Expanded", "Expanding");
	undock();
};

var iframe_loaded = function(e) {
	document.getElementById("WikiFrameBox").style.display = "";
	wikibox.getElementsByTagName("p")[0].style.display = "none";
};

var findPos = function(obj, lefttop) {
	return (obj ? findPos(obj.offsetParent, [lefttop[0] - obj.offsetLeft, lefttop[1] - obj.offsetTop]) : lefttop);
};

var set_opacity = function(el, value) {
	el.style.opacity = value;
	el.style.filter = (value != 1) ? "alpha(Opacity=" + value * 100 + ")" : "";
};

init();
