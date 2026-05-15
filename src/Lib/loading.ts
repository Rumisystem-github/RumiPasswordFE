const NI_SPACE = "  ";
const PREFIX_OK = `[${NI_SPACE}<SPAN STYLE="color: rgb(0, 255, 0);">OK</SPAN>${NI_SPACE}]`;
const PREFIX_FAILED = `[<SPAN STYLE="color: rgb(255, 0, 0);">FAILED</SPAN>]`;
const PREFIX_INFO = `[ INFO ]`;

let loading_display: HTMLDivElement|null = null;

export const LoadingType = {
	Ok: 4545,
	Failed: 1919,
	Info: 721,
	Wait: 69
} as const;
export type LoadingType = typeof LoadingType[keyof typeof LoadingType];

export function set_loading_display(el: HTMLDivElement) {
	loading_display = el;

	loading_display.style.position = "fixed";
	loading_display.style.top = "0px";
	loading_display.style.left = "0px";
	loading_display.style.width = "100vw";
	loading_display.style.height = "100vh";
	loading_display.style.zIndex = "1000";
	loading_display.style.backgroundColor = "#FFFFFF";

	console.info("LoadingDisplay v1.0\nse YagiRımiṠingo / https://rumi-room.net/");
}

export function close_loading() {
	loading_display?.remove();
}

export function loading_print(type: LoadingType, text: string) {
	if (loading_display == null) return;

	let prefix = "";
	if (type == LoadingType.Ok) prefix = PREFIX_OK;
	if (type == LoadingType.Failed) prefix = PREFIX_FAILED;
	if (type == LoadingType.Info) prefix = PREFIX_INFO;

	loading_display.innerHTML += `<DIV CLASS="RUMI_LOADING_LIB_ITEM">${prefix} ${text}</DIV>`;
}

export function loading_wait(text: string): string {
	if (loading_display == null) return "";
	const id = crypto.randomUUID();

	let el = document.createElement("DIV");
	el.className = "RUMI_LOADING_LIB_ITEM";
	el.dataset.id = id;

	let prefix = document.createElement("SPAN");
	prefix.className = "RUMI_LOADING_LIB_ITEM_PREFIX";
	prefix.innerText = "[*   **] ";
	el.append(prefix);

	let content = document.createElement("SPAN");
	content.innerText = text;
	el.append(content);

	loading_display.append(el);

	let level = 1;
	const interval = setInterval(function() {
		switch (level) {
			case 0:
				prefix.innerText = "[*   **] ";
				break;
			case 1:
				prefix.innerText = "[**   *] ";
				break;
			case 2:
				prefix.innerText = "[***   ] ";
				break;
			case 3:
				prefix.innerText = "[ ***  ] ";
				break;
			case 4:
				prefix.innerText = "[  *** ] ";
				break;
			case 5:
				prefix.innerText = "[   ***] ";
				break;
			default: {
				level = 0;
				return;
			}
		}

		level += 1;
	}, 400);
	el.dataset.interval = interval.toString();

	return id;
}

export function loading_wait_stop(id: string, ok:boolean) {
	const el = document.querySelector(`.RUMI_LOADING_LIB_ITEM[data-id="${id}"]`) as HTMLDataElement;
	if (el == null) return;

	let interval = el.dataset.interval!;
	clearInterval(Number.parseInt(interval));

	const prefix = el.querySelector(".RUMI_LOADING_LIB_ITEM_PREFIX");
	if (prefix == null) return;
	if (ok) {
		prefix.innerHTML = PREFIX_OK + " ";
	} else {
		prefix.innerHTML = PREFIX_FAILED + " ";
	}
}