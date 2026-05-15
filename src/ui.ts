import { mel, site_list } from "./main";
import { site_list_item } from "./UIItem/site_list_item";

export function page_close() {
	mel.contents.site.parent.style.display = "none";
}

export async function refresh_site_list() {
	for (const site of site_list) {
		mel.side.site_list.append(site_list_item(site));
	}
}