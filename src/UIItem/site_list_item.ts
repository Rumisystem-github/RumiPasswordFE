import { spa } from "../main";
import type { Site } from "../Type/item";

export function site_list_item(site: Site): HTMLDivElement {
	let item = document.createElement("DIV") as HTMLDivElement;
	item.dataset.id = site.ID;
	item.innerText = site.NAME;

	item.onclick = function() {
		spa.open(`/site/${site.ID}`);
	};

	return item;
}