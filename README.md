drag-resize-dock
================

JavaScript library creating content windows which are dragable, resizable from corners and edges, and dock/escape edges.

Drag-Resize-Dock is a modularized version of the Wikipedia element entries that pop up when clicking elements on [Ptable.com](http://www.ptable.com/).

## Advantages

* Lightweight. No dependencies on any other libraries.
* Supports all modern browsers except IE6.
* Highly customizable.
* No installation. Load the script and set the class of elements that can be clicked to `DragResizeDock`.
* Middle and Shift/Ctrl clicks bypass the script and open normally.

## Features

* Resize from any corner or edge.
* When dragged to an edge, the window either docks or escapes by opening a new window at its last location, depending on popup blocker settings.
* Animated transition from the location of the clicked link to its full size and position.
* Smart resizing when docked that allocates more room for the page content or shifts it over as needed.
* If the top or bottom edge is dragged to the top or bottom of the page, it will expand to the full height of the page.
* Remembers sizes after being closed and reopened.
