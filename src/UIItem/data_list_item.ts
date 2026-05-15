import { base64_decode, decrypt } from "../main";
import type { Data } from "../Type/item";

export async function data_list_item(data: Data): Promise<HTMLDivElement> {
	let item = document.createElement("DIV") as HTMLDivElement;
	item.className = "DATA_ITEM";

	let name_el = document.createElement("DIV") as HTMLDivElement;
	name_el.className = "NAME";
	name_el.innerText = "お待ち下さい";
	item.append(name_el);

	let value_el = document.createElement("DIV") as HTMLDivElement;
	value_el.className = "VALUE";
	item.append(value_el);

	(async function() {
		const raw = await decrypt({ cipher: base64_decode(data.DATA), iv: base64_decode(data.IV), tag: base64_decode(data.TAG), key_id: data.KEY_ID });
		switch (data.NAME) {
			case "__USER_ID": {
				const text = new TextDecoder().decode(raw);
				name_el.innerText = "ユーザーID";
				value_el.append(data_text(text));
				return;
			}

			case "__MAIL_ADDRESS": {
				const text = new TextDecoder().decode(raw);
				name_el.innerText = "メールアドレス";
				value_el.append(data_text(text));
				return;
			}

			case "__FEDIVERSE_ADDRESS": {
				const text = new TextDecoder().decode(raw);
				name_el.innerText = "Fediverseアドレス";
				value_el.append(data_text(text));
				return;
			}

			case "__PASSWORD": {
				const text = new TextDecoder().decode(raw);
				name_el.innerText = "パスワード";
				value_el.append(hide_text(text));
				return;
			}

			default: {
				const text = new TextDecoder().decode(raw);
				name_el.innerText = data.NAME;
				value_el.append(data_text(text));
				return;
			}
		}
	})();

	return item;
}

async function cpi(text: string) {
	await navigator.clipboard.writeText(text);
}

function data_text(text: string): HTMLDivElement {
	let el = document.createElement("DIV") as HTMLDivElement;

	el.innerText = text;

	el.onclick = async function() {
		await cpi(text);
	}

	return el;
}

function hide_text(text: string): HTMLDivElement {
	let el = document.createElement("DIV") as HTMLDivElement;

	el.innerText = text;
	el.style.filter = "blur(10px)";

	el.onmouseover = function() {
		el.style.filter = "";
	}

	el.onmouseleave = function() {
		el.style.filter = "blur(10px)";
	}

	el.onclick = async function() {
		await cpi(text);
	}

	return el;
}