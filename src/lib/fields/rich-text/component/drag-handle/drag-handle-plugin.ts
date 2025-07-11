import { Extension } from '@tiptap/core';
import { NodeSelection, Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Fragment, Slice, Node } from '@tiptap/pm/model';
import { EditorView } from '@tiptap/pm/view';
import { serializeForClipboard } from './clipboard-serializer.js';

export interface GlobalDragHandleOptions {
	/**
	 * The width of the drag handle
	 */
	dragHandleWidth: number;

	/**
	 * The treshold for scrolling
	 */
	scrollTreshold: number;

	/*
	 * The css selector to query for the drag handle. (eg: '.custom-handle').
	 * If handle element is found, that element will be used as drag handle. If not, a default handle will be created
	 */
	dragHandleSelector?: string;

	/**
	 * Tags to be excluded for drag handle
	 */
	excludedTags: string[];

	/**
	 * Custom nodes to be included for drag handle
	 */
	customNodes: string[];
}
function absoluteRect(node: Element) {
	const data = node.getBoundingClientRect();
	const modal = node.closest('[role="dialog"]');

	if (modal && window.getComputedStyle(modal).transform !== 'none') {
		const modalRect = modal.getBoundingClientRect();

		return {
			top: data.top - modalRect.top,
			left: data.left - modalRect.left,
			width: data.width
		};
	}
	return {
		top: data.top,
		left: data.left,
		width: data.width
	};
}

function nodeDOMAtCoords(coords: { x: number; y: number }, options: GlobalDragHandleOptions) {
	const selectors = [
		'li',
		'p:not(:first-child)',
		'pre',
		'blockquote',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		...options.customNodes.map((node) => `[data-type=${node}]`)
	].join(', ');
	return document
		.elementsFromPoint(coords.x, coords.y)
		.find((elem: Element) => elem.parentElement?.matches?.('.ProseMirror') || elem.matches(selectors));
}
function nodePosAtDOM(node: Element, view: EditorView, options: GlobalDragHandleOptions) {
	const boundingRect = node.getBoundingClientRect();

	return view.posAtCoords({
		left: boundingRect.left + 50 + options.dragHandleWidth,
		top: boundingRect.top + 1
	})?.inside;
}

function calcNodePos(pos: number, view: EditorView) {
	const $pos = view.state.doc.resolve(pos);
	if ($pos.depth > 1) return $pos.before($pos.depth);
	return pos;
}

export function DragHandlePlugin(options: GlobalDragHandleOptions & { pluginKey: string }) {
	let listType = '';
	const blankImage = new Image();
	blankImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // transparent 1x1 pixel

	function handleDragStart(event: DragEvent, view: EditorView) {
		view.focus();

		if (!event.dataTransfer) return;

		const node = nodeDOMAtCoords(
			{
				x: event.clientX + 50 + options.dragHandleWidth,
				y: event.clientY
			},
			options
		);

		if (!(node instanceof Element)) return;

		let draggedNodePos = nodePosAtDOM(node, view, options);
		if (draggedNodePos == null || draggedNodePos < 0) return;
		draggedNodePos = calcNodePos(draggedNodePos, view);

		const { from, to } = view.state.selection;
		const diff = from - to;

		const fromSelectionPos = calcNodePos(from, view);
		let differentNodeSelected = false;

		const nodePos = view.state.doc.resolve(fromSelectionPos);

		// Check if nodePos points to the top level node
		if (nodePos.node().type.name === 'doc') differentNodeSelected = true;
		else {
			const nodeSelection = NodeSelection.create(view.state.doc, nodePos.before());

			// Check if the node where the drag event started is part of the current selection
			differentNodeSelected = !(
				draggedNodePos + 1 >= nodeSelection.$from.pos && draggedNodePos <= nodeSelection.$to.pos
			);
		}
		let selection = view.state.selection;
		if (!differentNodeSelected && diff !== 0 && !(view.state.selection instanceof NodeSelection)) {
			const endSelection = NodeSelection.create(view.state.doc, to - 1);
			selection = TextSelection.create(view.state.doc, draggedNodePos, endSelection.$to.pos);
		} else {
			selection = NodeSelection.create(view.state.doc, draggedNodePos);

			// if inline node is selected, e.g mention -> go to the parent node to select the whole node
			// if table row is selected, go to the parent node to select the whole node
			if (
				(selection as NodeSelection).node.type.isInline ||
				(selection as NodeSelection).node.type.name === 'tableRow'
			) {
				const $pos = view.state.doc.resolve(selection.from);
				selection = NodeSelection.create(view.state.doc, $pos.before());
			}
		}
		view.dispatch(view.state.tr.setSelection(selection));

		// If the selected node is a list item, we need to save the type of the wrapping list e.g. OL or UL
		if (view.state.selection instanceof NodeSelection && view.state.selection.node.type.name === 'listItem') {
			listType = node.parentElement!.tagName;
		}

		const slice = view.state.selection.content();
		const { dom, text } = serializeForClipboard(view, slice);

		event.dataTransfer.clearData();
		event.dataTransfer.setData('text/html', dom.innerHTML);
		event.dataTransfer.setData('text/plain', text);
		event.dataTransfer.effectAllowed = 'copyMove';

		// event.dataTransfer.setDragImage(blankImage, 0, 0);

		view.dragging = { slice, move: event.ctrlKey };
	}

	let dragHandleElement: HTMLElement | null = null;

	function hideDragHandle() {
		if (dragHandleElement) {
			dragHandleElement.classList.add('hide');
		}
	}

	function showDragHandle() {
		if (dragHandleElement) {
			dragHandleElement.classList.remove('hide');
		}
	}
	
	function handleMoveAF(view: EditorView, event: MouseEvent) {
		if (!view.editable) {
			return;
		}
		const node = nodeDOMAtCoords(
			{
				x: event.clientX + 50 + options.dragHandleWidth,
				y: event.clientY
			},
			options
		);

		const notDragging = node?.closest('.not-draggable');
		const excludedTagList = options.excludedTags.concat(['ol', 'ul']).join(', ');

		if (
			!(node instanceof Element) ||
			node.matches(excludedTagList) ||
			node.parentNode !== view.dom || // prevent handler showing on nested node
			notDragging
		) {
			hideDragHandle();
			return;
		}

		const compStyle = window.getComputedStyle(node);
		const parsedLineHeight = parseInt(compStyle.lineHeight, 10);
		const lineHeight = isNaN(parsedLineHeight) ? parseInt(compStyle.fontSize) * 1.2 : parsedLineHeight;

		const editorRect = absoluteRect(view.dom);
		const rect = absoluteRect(node);

		rect.top += lineHeight / 2 - 5;

		// rect.top += paddingTop;
		// Li markers
		if (node.matches('ul:not([data-type=taskList]) li, ol li')) {
			rect.left -= options.dragHandleWidth;
		}
		rect.width = options.dragHandleWidth / 2;

		if (!dragHandleElement) return;

		dragHandleElement.style.left = `${rect.left - rect.width - editorRect.left}px`;
		dragHandleElement.style.top = `${rect.top - editorRect.top + 8}px`;
		showDragHandle();
	}

	return new Plugin({
		key: new PluginKey(options.pluginKey),
		view: (view) => {
			const dragHandleSelector = options.dragHandleSelector
				? document.querySelector<HTMLElement>(options.dragHandleSelector)
				: null;

			dragHandleElement = dragHandleSelector ?? document.createElement('div');
			dragHandleElement.draggable = true;
			dragHandleElement.dataset.dragHandle = '';
			dragHandleElement.classList.add('drag-handle');

			function onDragHandleDragStart(e: DragEvent) {
				view.dom.classList.add('dragging');
				handleDragStart(e, view);
			}

			dragHandleElement.addEventListener('dragstart', onDragHandleDragStart);

			function onDragHandleDrag(e: DragEvent) {
				hideDragHandle();
				const scrollY = window.scrollY;
				if (e.clientY < options.scrollTreshold) {
					window.scrollTo({ top: scrollY - 30, behavior: 'smooth' });
				} else if (window.innerHeight - e.clientY < options.scrollTreshold) {
					window.scrollTo({ top: scrollY + 30, behavior: 'smooth' });
				}
			}

			dragHandleElement.addEventListener('drag', onDragHandleDrag);

			hideDragHandle();

			if (!dragHandleSelector) {
				view?.dom?.parentElement?.appendChild(dragHandleElement);
			}

			return {
				destroy: () => {
					if (!dragHandleSelector) {
						dragHandleElement?.remove?.();
					}
					dragHandleElement?.removeEventListener('drag', onDragHandleDrag);
					dragHandleElement?.removeEventListener('dragstart', onDragHandleDragStart);
					dragHandleElement = null;
				}
			};
		},
		props: {
			handleDOMEvents: {
				mousemove: (view, event) => {
					requestAnimationFrame(() => handleMoveAF(view, event));
				},
				keydown: () => {
					hideDragHandle();
				},
				mousewheel: () => {
					hideDragHandle();
				},
				drop: (view, event) => {
					view.dom.classList.remove('dragging');

					hideDragHandle();
					let droppedNode: Node | null = null;
					const dropPos = view.posAtCoords({
						left: event.clientX,
						top: event.clientY
					});

					if (!dropPos) return;

					if (view.state.selection instanceof NodeSelection) {
						droppedNode = view.state.selection.node;
					}
					if (!droppedNode) return;

					const resolvedPos = view.state.doc.resolve(dropPos.pos);

					const isDroppedInsideList = resolvedPos.parent.type.name === 'listItem';

					// If the selected node is a list item and is not dropped inside a list, we need to wrap it inside <ol> tag otherwise ol list items will be transformed into ul list item when dropped
					if (
						view.state.selection instanceof NodeSelection &&
						view.state.selection.node.type.name === 'listItem' &&
						!isDroppedInsideList &&
						listType == 'OL'
					) {
						const newList = view.state.schema.nodes.orderedList?.createAndFill(null, droppedNode);
						const slice = new Slice(Fragment.from(newList), 0, 0);
						view.dragging = { slice, move: event.ctrlKey };
					}
				},
				dragend: (view) => {
					view.dom.classList.remove('dragging');
				}
			}
		}
	});
}

const GlobalDragHandle = Extension.create({
	name: 'globalDragHandle',

	addOptions() {
		return {
			dragHandleWidth: 20,
			scrollTreshold: 100,
			excludedTags: [],
			customNodes: []
		};
	},

	addProseMirrorPlugins() {
		return [
			DragHandlePlugin({
				pluginKey: 'globalDragHandle',
				dragHandleWidth: this.options.dragHandleWidth,
				scrollTreshold: this.options.scrollTreshold,
				dragHandleSelector: this.options.dragHandleSelector,
				excludedTags: this.options.excludedTags,
				customNodes: this.options.customNodes
			})
		];
	}
});

export default GlobalDragHandle;
