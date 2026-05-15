/*
	v1.0
*/

export type RouteEvent = {

}
export type RouteEntry = (e: RouteEvent) => void;

type RouteTableItem = {
	path: string,
	is_prefix: boolean,
	entry: RouteEntry
}

export class RSPA {
	route_table:RouteTableItem[] = [];
	n404_page:RouteEntry|null = null;

	constructor() {
		console.info("RSPA v1.0\nse YagiRımiṠingo / https://rumi-room.net/");

		window.addEventListener("click", (e) => {
			if (e.target == null) return;

			let a: HTMLAnchorElement|null = null;

			//クリックした要素がAタグならセット
			if ((e.target as HTMLElement).tagName.toUpperCase() == "A") {
				a = e.target as HTMLAnchorElement
			} else {
				//Aタグをクリックしたわけじゃないので、親要素にAタグが居ないかを探す
				let cur = (e.target as HTMLElement).parentElement;
				while (true) {
					if (cur == null) break;
					if (cur.tagName.toUpperCase() == "A") {
						a = cur as HTMLAnchorElement;
						break;
					} else {
						cur = cur.parentElement
					}
				}
			}

			//Aタグあり？
			if (a != null) {
				//デフォのイベントを破棄
				e.preventDefault();

				const url = new URL(a.href);
				if (url.host === window.location.host) {
					//既に開いているなら無視
					if (url.pathname === window.location.pathname) return;
					this.open(url.pathname);
				} else {
					window.open(url.href, "_blank");
				}
			}
		});

		window.addEventListener("popstate", () => {
			this.__url_check();
		});
	}

	__url_check() {
		let cur_path = window.location.pathname;
		if (!cur_path.endsWith("/")) cur_path += "/";

		let e:RouteEvent = {};

		for (const item of this.route_table) {
			if (item.is_prefix) {
				if (cur_path.startsWith(item.path)) {
					item.entry(e);
					return;
				}
			} else {
				if (cur_path === item.path) {
					item.entry(e);
					return;
				}
			}
		}

		if (this.n404_page != null) this.n404_page(e);
	}

	set_route(path: string, is_prefix: boolean, entry: RouteEntry) {
		if (!path.endsWith("/")) path += "/";

		this.route_table.push(
			{
				path: path,
				is_prefix: is_prefix,
				entry: entry
			}
		);
	}

	set_404_page(entry: RouteEntry) {
		this.n404_page = entry;
	}

	open(path: string) {
		history.pushState("", "", path);

		this.__url_check();
	}

	start() {
		this.__url_check();
	}
}