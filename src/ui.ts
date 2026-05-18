import { dir_list, mel, site_list } from "./main";
import { site_list_item } from "./UIItem/site_list_item";

export function page_close() {
	mel.contents.site.parent.style.display = "none";
}

export async function ui_refresh_site_list() {
	mel.side.site_list.replaceChildren();

	//ディレクトリ無しサイト
	for (const site of site_list) {
		if (site.DIR == null) mel.side.site_list.append(site_list_item(site));
	}

	//ディレクトリありサイト
	for (const dir of dir_list) {
		let details = document.createElement("DETAILS") as HTMLDetailsElement;
		details.setAttribute("open", "");
		mel.side.site_list.append(details);

		let summary = document.createElement("SUMMARY");
		summary.innerText = dir.NAME;
		details.append(summary);

		for (const site of site_list) {
			if (site.DIR == dir.ID) details.append(site_list_item(site));
		}
	}
}